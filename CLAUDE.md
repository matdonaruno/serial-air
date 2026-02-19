# Serial Air - Development Guide

## Project Overview
Wireless serial monitor system: iOS app (React Native/Expo) + Arduino library (WirelessSerial).
See SPECIFICATION.md for full product spec.

## Project Structure
- `app/` — React Native (Expo) iOS app (TypeScript)
- `arduino/WirelessSerial/` — Arduino library (C++, ESP8266/ESP32)
- `docs/` — Documentation

## Tech Stack
- **iOS App**: React Native + Expo + TypeScript
- **State Management**: Zustand
- **TCP**: react-native-tcp-socket
- **mDNS**: react-native-zeroconf
- **Arduino**: Pure C++ library, no external dependencies

## Commands
```bash
# iOS App
cd app && npm install          # Install dependencies
cd app && npx expo start       # Start dev server
cd app && eas build --platform ios  # Build for iOS

# Arduino
# Open examples in Arduino IDE or PlatformIO
```

## Key Patterns
- Expo Router (file-based routing) in `app/app/`
- Zustand stores in `app/src/stores/`
- TCP/mDNS services in `app/src/services/`
- Arduino library follows standard Arduino library structure

## Important Notes
- Expo Development Build required (not Expo Go) for native TCP module
- ESP8266 has 80KB RAM — library must use < 2KB
- mDNS service type: `_serial-air._tcp.`
- Default TCP port: 23
- iOS needs NSLocalNetworkUsageDescription in Info.plist
