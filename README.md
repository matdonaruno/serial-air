# Serial Air

Wireless Serial Monitor for Arduino, ESP8266 & ESP32.

Monitor your microcontroller's serial output on your iPhone — no PC required.

## What is Serial Air?

Serial Air is a system consisting of:

1. **iOS App** — Real-time serial monitor with auto device discovery
2. **Arduino Library** (`WirelessSerial`) — 2 lines of code to enable wireless serial

## How It Works

```
[ESP8266/ESP32]  ───── WiFi TCP ─────→  [iPhone App]
     │                                        │
  Serial.println("Hello!")              "Hello!" displayed
     │                                   with timestamp
  WirelessSerial mirrors                 in real-time
  output over TCP:23
```

## Quick Start

### Arduino Side

```cpp
#include <WirelessSerial.h>

WirelessSerial ws;

void setup() {
    Serial.begin(115200);
    WiFi.begin("your-ssid", "your-password");
    ws.begin();          // Start TCP server on port 23
    ws.mirror(Serial);   // Mirror Serial output to TCP
}

void loop() {
    ws.handle();
    Serial.println("Hello from ESP!");  // Goes to USB + WiFi
    delay(1000);
}
```

### iOS Side

1. Install **Serial Air** from the App Store
2. Connect your iPhone to the same WiFi network
3. Open the app — your device appears automatically
4. Tap to connect and see serial output in real-time

## Features

### iOS App
- Automatic device discovery (Bonjour/mDNS)
- Real-time log with timestamps
- Text search and filtering
- Log save and share
- Command sending (bidirectional)
- Auto-reconnect
- Dark mode

### Arduino Library
- ESP8266 and ESP32 support
- Mirror mode (existing Serial.println works wirelessly)
- mDNS service advertising
- Up to 3 simultaneous clients
- Minimal memory footprint (< 2KB RAM)

## Supported Platforms

| Platform | Status |
|----------|--------|
| ESP8266 | Supported |
| ESP32 | Supported |
| iOS 16+ | Supported |

## Development

See [SPECIFICATION.md](SPECIFICATION.md) for full product specification.

## License

MIT
