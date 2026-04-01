# WirelessSerial

Wireless serial monitor over WiFi TCP and BLE for ESP8266 and ESP32.

Part of the **Serial Air** system — pairs with the [Serial Air iOS app](https://github.com/matdonaruno/serial-air).

## Quick Start

```cpp
#include <WirelessSerial.h>

WirelessSerial ws;
Print* output;

void setup() {
    Serial.begin(115200);
    WiFi.begin("SSID", "PASSWORD");
    while (WiFi.status() != WL_CONNECTED) delay(500);

    ws.begin();
    ws.enableBuffer();
    output = ws.mirror(Serial);
    output->println("Hello from Serial Air!");
    output->print("Device ID: ");
    output->println(ws.getDeviceId());
}

void loop() {
    ws.handle();
    output->println("Hello!");
    delay(1000);
}
```

## Features

- **WiFi TCP** server on configurable port (default: 23)
- **BLE UART** (Nordic UART Service) on ESP32/C3/S3
- **mDNS** auto-discovery (compatible with Serial Air iOS app)
- **Device ID**: unique MAC-based identifier (SA-AABBCCDDEEFF)
- **Mirror mode**: output to Serial USB + WiFi + BLE simultaneously
- **Ring buffer**: retains output when no client connected, flushes on connect
- **Security**: optional pairing code or password authentication
- **Device fingerprint**: heap size, version, device type sent on connect
- Up to 5 concurrent TCP clients
- Minimal memory footprint (< 4KB RAM with default 2KB buffer)

## API

### Lifecycle
| Method | Description |
|--------|-------------|
| `begin(port, mdnsName)` | Start TCP server and mDNS |
| `stop()` | Stop server and BLE |
| `handle()` | Process connections (call in loop) |

### Mirror Mode
| Method | Description |
|--------|-------------|
| `mirror(serial)` | Enable mirror mode, returns DualPrint* |
| `unmirror()` | Disable mirror mode |

### BLE (ESP32 only)
| Method | Description |
|--------|-------------|
| `beginBLE(name)` | Start BLE UART service (NUS) |
| `stopBLE()` | Stop BLE service |
| `isBLERunning()` | BLE status |
| `bleClientCount()` | Connected BLE clients |

### Security
| Method | Description |
|--------|-------------|
| `enablePairing()` | Enable 4-digit pairing code verification |
| `setPassword(pass)` | Require password for connection |
| `getDeviceId()` | Get unique device ID (SA-XXXXXXXXXXXX) |

### Configuration
| Method | Description |
|--------|-------------|
| `setMaxClients(n)` | Set max TCP clients (1-5) |
| `enableBuffer(size)` | Enable ring buffer (default: 2048 bytes) |
| `disableBuffer()` | Disable and free ring buffer |
| `bufferedBytes()` | Bytes currently in buffer |
| `clientCount()` | Connected TCP clients |
| `isRunning()` | Server status |

## BLE Support (Optional)

BLE is **disabled by default** to keep sketch size small (~270KB WiFi-only).
To enable BLE, add `#define WS_ENABLE_BLE 1` **before** the include:

```cpp
// Step 1: Enable BLE
#define WS_ENABLE_BLE 1

// Step 2: Include library
#include <WirelessSerial.h>

// Step 3: In setup(), start BLE
ws.begin();
ws.beginBLE();  // Uses device ID as BLE name
output = ws.mirror(Serial);
// Data now goes to Serial + WiFi + BLE
```

**Important**: BLE adds ~1.2MB to flash usage. You must change:
- Arduino IDE → Tools → **Partition Scheme** → **"Huge APP (3MB No OTA)"**

### Size comparison (ESP32)
| Mode | Flash Usage | User Code Space | Notes |
|------|------------|----------------|-------|
| WiFi only (default) | ~935KB (71%) | **~375KB free** | Fits default partition |
| WiFi + BLE | ~1.7MB (55%) | **~1.4MB free** | Needs Huge APP (3MB) |

Note: ~884KB is the ESP32 WiFi stack itself. WirelessSerial adds only ~22-50KB.
ESP8266 is much smaller: ~272KB (25%) total.

### Optional: strip mDNS or security
```cpp
#define WS_NO_MDNS 1      // Skip mDNS (manual IP only, saves ~29KB on ESP8266)
#define WS_NO_SECURITY 1  // Remove pairing/password support
#include <WirelessSerial.h>
```

### ESP32-C3 specific
- Auto-detects NimBLE vs Bluedroid
- WiFi fix: `WiFi.setTxPower(WIFI_POWER_8_5dBm)` for stable connection
- TCP fix: uses `server->accept()` for Arduino Core 3.x compatibility

## Security

### Pairing Code
```cpp
ws.begin();
ws.enablePairing();
// When a client connects:
// - 4-digit code printed to Serial monitor
// - Client must verify the code in the app
```

### Password
```cpp
ws.begin();
ws.setPassword("mySecret123");
// Client must provide the correct password to connect
```

## Ring Buffer

```cpp
ws.enableBuffer();       // 2KB default
ws.enableBuffer(4096);   // custom size
ws.disableBuffer();      // disable and free memory
```

Captures boot messages before app connects.

## Examples

- **BasicMirror** — STA mode, simplest usage
- **APModeMirror** — AP mode, no router needed
- **BLEMirror** — WiFi + BLE (ESP32)
- **ESP32BothModes** — AP+STA simultaneous (ESP32)
- **CustomPort** — Custom port and mDNS name
- **SerialAirTest** — Full test firmware for Serial Air app (ESP32-C3)

## Installation

### Arduino IDE
1. Download this repository as ZIP
2. Arduino IDE → Sketch → Include Library → Add .ZIP Library

### Manual
Copy to your Arduino libraries directory:
- macOS: `~/Documents/Arduino/libraries/WirelessSerial/`
- Windows: `Documents\Arduino\libraries\WirelessSerial\`
- Linux: `~/Arduino/libraries/WirelessSerial/`

## Supported Platforms

| Board | WiFi | BLE | Notes |
|-------|------|-----|-------|
| ESP8266 | ✅ | — | NodeMCU, Wemos D1 Mini |
| ESP32 | ✅ | ✅ | All variants |
| ESP32-C3 | ✅ | ✅ | Needs Huge APP partition, TX power fix |
| ESP32-S3 | ✅ | ✅ | |
| Arduino UNO R4 WiFi | ✅ | — | No mDNS, manual IP connection |

## License

MIT
