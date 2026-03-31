#ifndef WIRELESS_SERIAL_H
#define WIRELESS_SERIAL_H

#include <Arduino.h>
#include <Print.h>

#ifdef ESP8266
  #include <ESP8266WiFi.h>
  #include <ESP8266mDNS.h>
#elif defined(ESP32)
  #include <WiFi.h>
  #include <ESPmDNS.h>
#else
  #error "WirelessSerial only supports ESP8266 and ESP32"
#endif

// BLE is OFF by default to keep sketch size small (~270KB WiFi-only vs ~1.5MB with BLE).
// To enable BLE, add this BEFORE #include <WirelessSerial.h>:
//   #define WS_ENABLE_BLE 1
// Also requires: Partition Scheme → "Huge APP (3MB No OTA)" in Arduino IDE.
#if defined(ESP32) && defined(WS_ENABLE_BLE)
  #define WS_BLE_ENABLED 1
  #if __has_include(<NimBLEDevice.h>)
    #define WS_USE_NIMBLE 1
    #include <NimBLEDevice.h>
  #else
    #define WS_USE_NIMBLE 0
    #include <BLEDevice.h>
    #include <BLEServer.h>
    #include <BLEUtils.h>
    #include <BLE2902.h>
  #endif
#else
  #define WS_BLE_ENABLED 0
#endif

#include "DualPrint.h"

#define WIRELESS_SERIAL_VERSION "1.2.0"
#define WIRELESS_SERIAL_DEFAULT_PORT 23
#define WIRELESS_SERIAL_DEFAULT_MDNS "esp-serial"
#define WIRELESS_SERIAL_MAX_CLIENTS_LIMIT 5
#define WIRELESS_SERIAL_DEFAULT_MAX_CLIENTS 3
#define WIRELESS_SERIAL_DEFAULT_BUFFER_SIZE 2048

class WirelessSerial : public Print {
public:
    WirelessSerial();
    ~WirelessSerial();

    // ========== Lifecycle ==========

    /// Start TCP server and mDNS service.
    /// @param port TCP port number (default: 23)
    /// @param mdnsName mDNS service name (default: "esp-serial")
    void begin(uint16_t port = WIRELESS_SERIAL_DEFAULT_PORT,
               const char* mdnsName = WIRELESS_SERIAL_DEFAULT_MDNS);

    /// Stop server and disconnect all clients.
    void stop();

    /// Handle client connections. Call in loop().
    void handle();

    // ========== Mirror Mode ==========

    /// Mirror Serial output to TCP clients.
    DualPrint* mirror(Print& serial);

    /// Disable mirroring.
    void unmirror();

    /// Check if mirroring is active.
    bool isMirroring() const;

    /// Get the DualPrint instance (nullptr if not mirroring).
    DualPrint* getDualPrint() const;

    // ========== Direct Output (Print interface) ==========

    size_t write(uint8_t byte) override;
    size_t write(const uint8_t* buffer, size_t size) override;

    // ========== Status ==========

    /// Number of connected clients.
    uint8_t clientCount() const;

    /// Whether the server is running.
    bool isRunning() const;

    // ========== Security ==========

    /// Enable pairing code verification on new connections.
    /// A random 4-digit code is printed to Serial and sent to the client.
    /// Client must respond with the same code to complete connection.
    void enablePairing();

    /// Set a password required for connection.
    /// Client must send the correct password to complete connection.
    void setPassword(const char* password);

    // ========== Configuration ==========

    /// Set maximum number of clients (default: 3, max: 5).
    void setMaxClients(uint8_t maxClients);

    /// Enable ring buffer for offline data retention.
    /// When no clients are connected, write() stores data in the buffer.
    /// When a client connects, buffered data is flushed automatically.
    /// @param size Buffer size in bytes (default: 2048). 0 to disable.
    void enableBuffer(size_t size = WIRELESS_SERIAL_DEFAULT_BUFFER_SIZE);

    /// Disable and free the ring buffer.
    void disableBuffer();

    /// Get number of bytes currently in the buffer.
    size_t bufferedBytes() const;

    /// Get the unique device ID (SA-AABBCCDDEEFF format).
    const char* getDeviceId() const;

#if WS_BLE_ENABLED
    // ========== BLE (ESP32 only) ==========

    /// Start BLE UART service (Nordic UART Service).
    void beginBLE(const char* bleName = nullptr);

    /// Stop BLE service.
    void stopBLE();

    /// Whether BLE is active.
    bool isBLERunning() const;

    /// Number of connected BLE clients.
    uint8_t bleClientCount() const;
#endif

private:
    char _deviceId[16];
    bool _pairingEnabled;
    char _password[32];
    bool _clientAuthenticated[WIRELESS_SERIAL_MAX_CLIENTS_LIMIT];

    WiFiServer* _server;
    WiFiClient _clients[WIRELESS_SERIAL_MAX_CLIENTS_LIMIT];
    uint8_t _maxClients;
    bool _running;
    uint16_t _port;

    DualPrint* _dualPrint;
    bool _mirroring;

    // Ring buffer
    uint8_t* _ringBuf;
    size_t _ringSize;
    size_t _ringHead;  // next write position
    size_t _ringCount; // bytes stored

    void _acceptNewClients();
    void _cleanupClients();
    void _bufferWrite(const uint8_t* data, size_t len);
    void _flushBufferTo(WiFiClient& client);
    void _sendSecurityChallenge(WiFiClient& client, uint8_t idx);

#if WS_BLE_ENABLED
    BLEServer* _bleServer;
    BLECharacteristic* _bleTxChar;
    BLECharacteristic* _bleRxChar;
    bool _bleRunning;
    bool _bleClientConnected;

    friend class _WsBleServerCallbacks;
    friend class _WsBleRxCallbacks;
#endif
};

#endif // WIRELESS_SERIAL_H
