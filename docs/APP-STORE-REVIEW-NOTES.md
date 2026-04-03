# Serial Air — App Store Review Notes

## What is Serial Air?

Serial Air is a wireless serial monitor that connects to microcontrollers (ESP8266, ESP32, Arduino UNO R4 WiFi, Raspberry Pi) over WiFi (TCP) and Bluetooth Low Energy (BLE). It replaces the wired USB serial monitor workflow with a wireless one.

## Hardware Requirement

This app requires an external microcontroller running the open-source WirelessSerial library. Without hardware, the app still provides:
- A code generator for 6 different boards
- Command macro management
- Full settings configuration
- Onboarding with security guide

## Demo Video

[Include a 30-60 second video showing:]
1. ESP32 running WirelessSerial firmware
2. App discovering the device via BLE
3. Tapping to connect → serial data flowing
4. Switching to plotter view
5. Sending a command from the macro tab

## In-App Purchase

IAP is intentionally **disabled** for v1.0 (FREE_MODE=true). All features are free. The IAP product `serial_air_pro` is NOT configured in App Store Connect. The paywall screen exists in code but is unreachable in this version.

## Privacy

- No data leaves the device
- No analytics, tracking, or advertising SDKs
- No user accounts or server-side storage
- All data stored locally (AsyncStorage + iOS Keychain)
- Privacy Policy: https://umemasait.com/serial-air/privacy.html
- Terms of Service: https://umemasait.com/serial-air/terms.html

## Permissions

- **Local Network** (NSLocalNetworkUsageDescription): Required to discover microcontrollers via mDNS and connect via TCP on the local network
- **Bluetooth** (NSBluetoothAlwaysUsageDescription): Required to discover and connect to ESP32 devices via BLE

## Languages

16 languages supported: English, Japanese, Chinese (Simplified/Traditional), Korean, Thai, Vietnamese, Indonesian, Hindi, German, French, Spanish, Portuguese, Italian, Russian, Arabic

## Test Without Hardware

If you do not have an ESP32/ESP8266:
1. Open the app → navigate to the Code tab
2. See the code generator with 6 board options
3. Navigate to Monitor tab → shows "No device connected" gracefully
4. Navigate to Commands tab → create/manage macros without a connection
5. Settings → all options functional

---

## Submission TODO

- [ ] デモ動画撮影（ESP32実機接続フロー）
- [ ] App Store Connectメタデータ入力（説明文、キーワード、スクリーンショット）
- [ ] eas.json の appleId, ascAppId, appleTeamId 記入
- [ ] `eas build --platform ios` でプロダクションビルド
- [ ] `eas submit --platform ios` でApp Storeに提出
- [ ] App Store Connectで審査ノート（このファイルの内容）を貼り付け
- [ ] Privacy Nutrition Label: "Data Not Collected" を選択
