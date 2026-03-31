#include "WirelessSerial.h"

// Nordic UART Service UUIDs
#if WS_BLE_ENABLED
#define NUS_SERVICE_UUID        "6E400001-B5A3-F393-E0A9-E50E24DCCA9E"
#define NUS_TX_CHARACTERISTIC   "6E400003-B5A3-F393-E0A9-E50E24DCCA9E"
#define NUS_RX_CHARACTERISTIC   "6E400002-B5A3-F393-E0A9-E50E24DCCA9E"
#define BLE_MTU_PAYLOAD 20

// BLE callback classes (forward references to WirelessSerial instance via pointer)
static WirelessSerial* _bleInstance = nullptr;

class _WsBleServerCallbacks : public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) override {
        if (_bleInstance) _bleInstance->_bleClientConnected = true;
    }
    void onDisconnect(BLEServer* pServer) override {
        if (_bleInstance) {
            _bleInstance->_bleClientConnected = false;
            // Restart advertising
            pServer->startAdvertising();
        }
    }
};

class _WsBleRxCallbacks : public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic* pChar) override {
        // Data received from BLE client — currently no-op
        // Could forward to Serial if needed
    }
};
#endif

WirelessSerial::WirelessSerial()
    : _server(nullptr)
    , _maxClients(WIRELESS_SERIAL_DEFAULT_MAX_CLIENTS)
    , _running(false)
    , _port(WIRELESS_SERIAL_DEFAULT_PORT)
    , _dualPrint(nullptr)
    , _mirroring(false)
    , _ringBuf(nullptr)
    , _ringSize(0)
    , _ringHead(0)
    , _ringCount(0)
#if WS_BLE_ENABLED
    , _bleServer(nullptr)
    , _bleTxChar(nullptr)
    , _bleRxChar(nullptr)
    , _bleRunning(false)
    , _bleClientConnected(false)
#endif
{
    _deviceId[0] = '\0';
#ifndef WS_NO_SECURITY
    _pairingEnabled = false;
    _password[0] = '\0';
    memset(_clientAuthenticated, 0, sizeof(_clientAuthenticated));
#endif
}

WirelessSerial::~WirelessSerial() {
    stop();
    disableBuffer();
}

void WirelessSerial::begin(uint16_t port, const char* mdnsName) {
    if (_running) {
        stop();
    }

    _port = port;

    // Generate device ID from MAC address: SA-AABBCCDDEEFF
    uint8_t mac[6];
    WiFi.macAddress(mac);
    snprintf(_deviceId, sizeof(_deviceId), "SA-%02X%02X%02X%02X%02X%02X",
             mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);

    _server = new WiFiServer(port);
    _server->begin();
    Serial.printf("[WS] TCP server started on port %d\n", port);

#ifdef ESP8266
    _server->setNoDelay(true);
#endif

#ifndef WS_NO_MDNS
    // Start mDNS service
    if (MDNS.begin(mdnsName)) {
        MDNS.addService("serial-air", "tcp", port);
        MDNS.addServiceTxt("serial-air", "tcp", "version", WIRELESS_SERIAL_VERSION);
        MDNS.addServiceTxt("serial-air", "tcp", "id", (const char*)_deviceId);
#ifdef ESP8266
        MDNS.addServiceTxt("serial-air", "tcp", "device", "ESP8266");
#elif defined(ESP32)
        MDNS.addServiceTxt("serial-air", "tcp", "device", "ESP32");
#endif
    }
#endif

    _running = true;
}

void WirelessSerial::stop() {
    if (!_running) return;

    unmirror();

#if WS_BLE_ENABLED
    stopBLE();
#endif

    // Disconnect all clients
    for (uint8_t i = 0; i < _maxClients; i++) {
        if (_clients[i].connected()) {
            _clients[i].stop();
        }
    }

    if (_server) {
        _server->close();
        delete _server;
        _server = nullptr;
    }

    _running = false;
}

void WirelessSerial::handle() {
    if (!_running) return;

#if defined(ESP8266) && !defined(WS_NO_MDNS)
    MDNS.update();
#endif

    _acceptNewClients();
    _cleanupClients();
}

DualPrint* WirelessSerial::mirror(Print& serial) {
    unmirror();
    _dualPrint = new DualPrint(serial, *this);
    _mirroring = true;
    return _dualPrint;
}

void WirelessSerial::unmirror() {
    if (_dualPrint) {
        delete _dualPrint;
        _dualPrint = nullptr;
    }
    _mirroring = false;
}

bool WirelessSerial::isMirroring() const {
    return _mirroring;
}

DualPrint* WirelessSerial::getDualPrint() const {
    return _dualPrint;
}

size_t WirelessSerial::write(uint8_t byte) {
    return write(&byte, 1);
}

size_t WirelessSerial::write(const uint8_t* buffer, size_t size) {
    bool bleActive = false;
#if WS_BLE_ENABLED
    bleActive = _bleRunning;
#endif
    if (!_running && !bleActive) return 0;

    bool hasClient = false;
    size_t written = 0;

    // Send to TCP clients
    if (_running) {
        for (uint8_t i = 0; i < _maxClients; i++) {
            if (_clients[i].connected()) {
                hasClient = true;
                written = _clients[i].write(buffer, size);
            }
        }
    }

#if WS_BLE_ENABLED
    // Send to BLE client in 20-byte chunks
    if (_bleRunning && _bleClientConnected && _bleTxChar) {
        hasClient = true;
        size_t offset = 0;
        while (offset < size) {
            size_t chunk = (size - offset > BLE_MTU_PAYLOAD) ? BLE_MTU_PAYLOAD : (size - offset);
#if WS_USE_NIMBLE
            _bleTxChar->setValue(buffer + offset, chunk);
            _bleTxChar->notify(true);
#else
            _bleTxChar->setValue(const_cast<uint8_t*>(buffer + offset), chunk);
            _bleTxChar->notify();
#endif
            offset += chunk;
            if (offset < size) delay(10); // small delay between BLE chunks
        }
        written = size;
    }
#endif

    // No clients connected — store in ring buffer if enabled
    if (!hasClient && _ringBuf) {
        _bufferWrite(buffer, size);
        return size;
    }

    return written;
}

uint8_t WirelessSerial::clientCount() const {
    uint8_t count = 0;
    for (uint8_t i = 0; i < _maxClients; i++) {
        if (const_cast<WiFiClient&>(_clients[i]).connected()) {
            count++;
        }
    }
    return count;
}

bool WirelessSerial::isRunning() const {
    return _running;
}

#ifndef WS_NO_SECURITY
// ========== Security ==========

void WirelessSerial::enablePairing() {
    _pairingEnabled = true;
}

void WirelessSerial::setPassword(const char* password) {
    strncpy(_password, password, sizeof(_password) - 1);
    _password[sizeof(_password) - 1] = '\0';
}
#endif

void WirelessSerial::setMaxClients(uint8_t maxClients) {
    if (maxClients > WIRELESS_SERIAL_MAX_CLIENTS_LIMIT) {
        maxClients = WIRELESS_SERIAL_MAX_CLIENTS_LIMIT;
    }
    if (maxClients < 1) {
        maxClients = 1;
    }
    _maxClients = maxClients;
}

// ========== Buffer ==========

void WirelessSerial::enableBuffer(size_t size) {
    disableBuffer();
    if (size == 0) return;
    _ringBuf = new uint8_t[size];
    _ringSize = size;
    _ringHead = 0;
    _ringCount = 0;
}

void WirelessSerial::disableBuffer() {
    if (_ringBuf) {
        delete[] _ringBuf;
        _ringBuf = nullptr;
    }
    _ringSize = 0;
    _ringHead = 0;
    _ringCount = 0;
}

size_t WirelessSerial::bufferedBytes() const {
    return _ringCount;
}

const char* WirelessSerial::getDeviceId() const {
    return _deviceId;
}

void WirelessSerial::_bufferWrite(const uint8_t* data, size_t len) {
    for (size_t i = 0; i < len; i++) {
        _ringBuf[_ringHead] = data[i];
        _ringHead = (_ringHead + 1) % _ringSize;
        if (_ringCount < _ringSize) {
            _ringCount++;
        }
        // When full, _ringHead overwrites oldest data (ring behavior)
    }
}

void WirelessSerial::_flushBufferTo(WiFiClient& client) {
    if (!_ringBuf || _ringCount == 0) return;

    // Calculate start position of oldest data
    size_t start;
    if (_ringCount < _ringSize) {
        start = 0;
    } else {
        start = _ringHead; // head has wrapped, oldest is at head
    }

    // Send in up to 2 chunks (wrap-around)
    if (start + _ringCount <= _ringSize) {
        // Contiguous
        client.write(_ringBuf + start, _ringCount);
    } else {
        // Wraps around
        size_t firstChunk = _ringSize - start;
        client.write(_ringBuf + start, firstChunk);
        client.write(_ringBuf, _ringCount - firstChunk);
    }

    // Clear buffer after flush
    _ringHead = 0;
    _ringCount = 0;
}

// ========== Private ==========

void WirelessSerial::_acceptNewClients() {
    if (!_server) return;

#ifdef ESP8266
    if (_server->hasClient()) {
        for (uint8_t i = 0; i < _maxClients; i++) {
            if (!_clients[i].connected()) {
                _clients[i] = _server->accept();
                _clients[i].setNoDelay(true);
#ifndef WS_NO_SECURITY
                _clientAuthenticated[i] = !_pairingEnabled && _password[0] == '\0';
                _sendSecurityChallenge(_clients[i], i);
#endif
                _flushBufferTo(_clients[i]);
                return;
            }
        }
        WiFiClient rejected = _server->accept();
        rejected.stop();
    }
#else // ESP32
    WiFiClient newClient = _server->accept();
    if (newClient) {
        for (uint8_t i = 0; i < _maxClients; i++) {
            if (!_clients[i].connected()) {
                _clients[i] = newClient;
#ifndef WS_NO_SECURITY
                _clientAuthenticated[i] = !_pairingEnabled && _password[0] == '\0';
                _sendSecurityChallenge(_clients[i], i);
#endif
                _flushBufferTo(_clients[i]);
                return;
            }
        }
        // No free slot, reject
        newClient.stop();
    }
#endif
}

void WirelessSerial::_cleanupClients() {
    for (uint8_t i = 0; i < _maxClients; i++) {
        if (_clients[i] && !_clients[i].connected()) {
            _clients[i].stop();
#ifndef WS_NO_SECURITY
            _clientAuthenticated[i] = false;
#endif
        }
    }
}

#ifndef WS_NO_SECURITY
void WirelessSerial::_sendSecurityChallenge(WiFiClient& client, uint8_t idx) {
    // Send device fingerprint (always, for fingerprint verification)
    char fp[128];
    snprintf(fp, sizeof(fp), "\x01FP:{\"id\":\"%s\",\"heap\":%lu,\"version\":\"%s\"}\n",
             _deviceId, (unsigned long)ESP.getFreeHeap(), WIRELESS_SERIAL_VERSION);
    client.print(fp);

    if (_pairingEnabled) {
        uint16_t code = random(1000, 10000);
        char msg[32];
        snprintf(msg, sizeof(msg), "\x01PAIR:%04d\n", code);
        client.print(msg);
        Serial.printf("[WS] Pairing code: %04d\n", code);
    } else if (_password[0] != '\0') {
        client.print("\x01AUTH:REQUIRED\n");
    } else {
        _clientAuthenticated[idx] = true;
    }
}
#endif

// ========== BLE (ESP32 only) ==========

#if WS_BLE_ENABLED

void WirelessSerial::beginBLE(const char* bleName) {
    if (_bleRunning) stopBLE();

    // Use device ID as BLE name if none provided
    const char* name = bleName ? bleName : (_deviceId[0] ? _deviceId : "SerialAir");

    _bleInstance = this;

    BLEDevice::init(name);
    _bleServer = BLEDevice::createServer();
    _bleServer->setCallbacks(new _WsBleServerCallbacks());

    BLEService* pService = _bleServer->createService(NUS_SERVICE_UUID);

    // TX Characteristic (server -> client, notify)
    _bleTxChar = pService->createCharacteristic(
        NUS_TX_CHARACTERISTIC,
        BLECharacteristic::PROPERTY_NOTIFY
    );
#if !WS_USE_NIMBLE
    _bleTxChar->addDescriptor(new BLE2902());
#endif

    // RX Characteristic (client -> server, write)
    _bleRxChar = pService->createCharacteristic(
        NUS_RX_CHARACTERISTIC,
        BLECharacteristic::PROPERTY_WRITE | BLECharacteristic::PROPERTY_WRITE_NR
    );
    _bleRxChar->setCallbacks(new _WsBleRxCallbacks());

    pService->start();

    // Start advertising
    BLEAdvertising* pAdvertising = BLEDevice::getAdvertising();
    pAdvertising->addServiceUUID(NUS_SERVICE_UUID);
    pAdvertising->setScanResponse(true);
#if !WS_USE_NIMBLE
    pAdvertising->setMinPreferred(0x06);
#endif
    BLEDevice::startAdvertising();

    _bleRunning = true;
}

void WirelessSerial::stopBLE() {
    if (!_bleRunning) return;
    BLEDevice::deinit(false);
    _bleServer = nullptr;
    _bleTxChar = nullptr;
    _bleRxChar = nullptr;
    _bleRunning = false;
    _bleClientConnected = false;
    _bleInstance = nullptr;
}

bool WirelessSerial::isBLERunning() const {
    return _bleRunning;
}

uint8_t WirelessSerial::bleClientCount() const {
    return _bleClientConnected ? 1 : 0;
}

#endif // WS_BLE_ENABLED
