# Serial Air — Setup Guide

## Arduino Library Setup

### Install via Arduino IDE

1. Download the `WirelessSerial` folder from `arduino/WirelessSerial/`
2. Copy it to your Arduino libraries folder:
   - macOS: `~/Documents/Arduino/libraries/`
   - Windows: `Documents\Arduino\libraries\`
   - Linux: `~/Arduino/libraries/`
3. Restart Arduino IDE

### Basic Usage

```cpp
#include <WirelessSerial.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

WirelessSerial ws;
DualPrint* output;

void setup() {
    Serial.begin(115200);
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) delay(500);

    ws.begin();                    // Start TCP server + mDNS
    output = ws.mirror(Serial);   // Mirror to both Serial and TCP
}

void loop() {
    ws.handle();                   // Must call every loop
    output->println("Hello!");     // Goes to Serial USB + TCP
    delay(1000);
}
```

## iOS App Setup (Development)

### Prerequisites

- Node.js 18+
- Xcode 15+
- Apple Developer account (for device builds)
- EAS CLI: `npm install -g eas-cli`

### Install & Run

```bash
cd app
npm install
npx expo start
```

### Development Build

The app uses native TCP modules, so Expo Go won't work. Create a development build:

```bash
# For simulator
eas build --profile development --platform ios

# For physical device
eas build --profile development --platform ios --no-wait
```

### Mock Server (no hardware needed)

```bash
node tools/mock-server.js
```

This simulates an ESP device on port 23. Connect from the app using your PC's IP address.

## Connecting

1. Power on your ESP device running WirelessSerial
2. Ensure your iPhone is on the same WiFi network
3. Open Serial Air — device should appear automatically via mDNS
4. Tap the device to start monitoring

### AP Mode

If your ESP is in AP mode:
1. Connect your iPhone to the ESP's WiFi network
2. Open Serial Air
3. Use manual connection: `192.168.4.1:23`

## Troubleshooting

See [troubleshooting.md](./troubleshooting.md) for common issues.
