#ifndef WIRELESS_SERIAL_H
#define WIRELESS_SERIAL_H

#include <Arduino.h>
#include <Print.h>

#ifdef ESP8266
  #include <ESP8266WiFi.h>
  #ifndef WS_NO_MDNS
    #include <ESP8266mDNS.h>
  #endif
#elif defined(ESP32)
  #include <WiFi.h>
  #ifndef WS_NO_MDNS
    #include <ESPmDNS.h>
  #endif
#elif defined(ARDUINO_UNOR4_WIFI)
  #include <WiFiS3.h>
  // R4 WiFi: mDNS not supported, use manual IP connection
  #define WS_NO_MDNS 1
  #define WS_NO_SECURITY 1  // No ESP.getFreeHeap() on R4
#else
  #error "WirelessSerial supports ESP8266, ESP32, and Arduino UNO R4 WiFi"
#endif

// ========== Build Options (define BEFORE #include <WirelessSerial.h>) ==========
//
// BLE is ON by default on ESP32. To disable (saves ~1.2MB):
//   #define WS_NO_BLE 1
//
// mDNS is ON by default for auto-discovery.
//   #define WS_NO_MDNS 1         // -29KB, manual IP connection only
//
// Security (pairing/password) is ON by default.
//   #define WS_NO_SECURITY 1     // Removes enablePairing()/setPassword()
//
// Size guide (ESP32):
//   WiFi only (WS_NO_BLE):   ~935KB (71%) - fits default partition
//   WiFi + BLE (default):     ~1.5MB - needs Huge APP partition
// =============================================================================
#if defined(ESP32) && !defined(WS_NO_BLE)
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

#ifndef WS_NO_SECURITY
    // ========== Security ==========

    /// Enable pairing code verification on new connections.
    void enablePairing();

    /// Set a password required for connection.
    void setPassword(const char* password);
#endif

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
#ifndef WS_NO_SECURITY
    bool _pairingEnabled;
    char _password[32];
    bool _clientAuthenticated[WIRELESS_SERIAL_MAX_CLIENTS_LIMIT];
#endif

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
#ifndef WS_NO_SECURITY
    void _sendSecurityChallenge(WiFiClient& client, uint8_t idx);
#endif

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
