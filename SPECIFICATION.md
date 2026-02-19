# Serial Air - Product Specification

## 1. Overview

### 1.1 Product Name
**Serial Air** — Wireless Serial Monitor for IoT Devices

### 1.2 Concept
PCなしでESP8266/ESP32等のマイコンのシリアル出力をiPhoneでリアルタイム確認できるシステム。
iOSアプリとArduinoライブラリのセットで提供する。

### 1.3 Problem Statement
- ESP8266/ESP32のデバッグにはPCとUSBケーブルが必須
- 設置済みデバイスのログ確認が困難（天井裏、屋外、遠隔地など）
- APモード設定時のトークン確認にPCのシリアルモニターが必要
- 既存のBLEシリアルアプリ（Wible等）はBLE専用でWiFi TCP非対応

### 1.4 Solution
WiFi TCP経由でシリアル出力をiPhoneに無線送信するシステム:
- **iOSアプリ**: デバイス自動検出 + リアルタイムログ表示
- **Arduinoライブラリ**: `WirelessSerial` — 既存コードに2行追加するだけで無線シリアル出力

### 1.5 Target Users
- IoTデバイス開発者（ESP8266/ESP32ユーザー）
- Arduino/電子工作の趣味ユーザー
- 設置済みデバイスのメンテナンス担当者
- 教育現場（プログラミング教室等）

### 1.6 Competitive Advantage
| 項目 | Serial Air | Wible (競合) | BLE Terminal系 |
|------|-----------|-------------|---------------|
| WiFi TCP | ✅ | ❌ | ❌ |
| BLE | v2.0予定 | ✅ | ✅ |
| ESP8266対応 | ✅ | ❌ (BLE非搭載) | ❌ |
| mDNS自動検出 | ✅ | N/A | N/A |
| Arduinoライブラリ同梱 | ✅ | ✅ | ❌ |
| ミラーモード | ✅ | ❌ | ❌ |

---

## 2. System Architecture

### 2.1 Overall Architecture
```
┌─────────────────────────────┐     WiFi TCP     ┌──────────────────────┐
│  ESP8266/ESP32 Device       │ ──────────────→  │  iOS App (Serial Air) │
│                             │   port 23        │                      │
│  ┌───────────────────────┐  │                  │  ┌──────────────────┐│
│  │ User's Arduino Sketch │  │   mDNS           │  │ Device Discovery ││
│  │                       │  │ ←────────────→   │  │ (Bonjour)        ││
│  │ Serial.println("...")─┼──┤                  │  └──────────────────┘│
│  │        │              │  │                  │                      │
│  │  ┌─────▼─────────┐   │  │                  │  ┌──────────────────┐│
│  │  │ WirelessSerial │   │  │  TCP stream      │  │ Log Viewer       ││
│  │  │ (Mirror Mode)  │───┼──┼────────────────→ │  │ (Real-time)      ││
│  │  └───────────────┘   │  │                  │  └──────────────────┘│
│  └───────────────────────┘  │                  │                      │
└─────────────────────────────┘                  └──────────────────────┘
```

### 2.2 Communication Protocol

#### TCP接続仕様
- **Protocol**: TCP (Transmission Control Protocol)
- **Default Port**: 23 (Telnet標準ポート、カスタマイズ可)
- **Encoding**: UTF-8
- **Delimiter**: `\n` (改行区切り)
- **Max Clients**: 3同時接続
- **Keep-Alive**: TCP keep-alive有効
- **Reconnection**: 自動再接続（5秒間隔、最大リトライ無制限）

#### mDNS Service Discovery
- **Service Type**: `_serial-air._tcp.local.`
- **Default Instance Name**: `esp-serial` (カスタマイズ可)
- **TXT Records**:
  - `device`: デバイス種別 (例: `ESP8266`, `ESP32`)
  - `version`: ライブラリバージョン
  - `baud`: 設定されたボーレート

#### データフォーマット
```
[raw text]\n
```
シリアル出力をそのままTCPストリームで送信。追加のプロトコルヘッダーは不要。
アプリ側でタイムスタンプを付与する。

---

## 3. Arduino Library — `WirelessSerial`

### 3.1 Library Overview

| 項目 | 内容 |
|------|------|
| Library Name | WirelessSerial |
| Language | C++ (Arduino compatible) |
| Supported Platforms | ESP8266, ESP32 |
| Dependencies | ESP8266WiFi (ESP8266) / WiFi (ESP32) |
| Distribution | Arduino Library Manager / GitHub Releases |
| License | MIT |

### 3.2 API Design

```cpp
#include <WirelessSerial.h>

class WirelessSerial : public Print {
public:
    // ========== Lifecycle ==========

    /// TCP サーバーと mDNS サービスを開始する
    /// @param port TCP ポート番号 (default: 23)
    /// @param mdnsName mDNS サービス名 (default: "esp-serial")
    ///        → "{mdnsName}.local" でアクセス可能
    void begin(uint16_t port = 23, const char* mdnsName = "esp-serial");

    /// サーバーを停止し、全クライアントを切断する
    void stop();

    /// クライアント接続管理。loop() 内で毎回呼ぶ。
    void handle();

    // ========== Mirror Mode ==========

    /// Serial出力をTCPにもミラーリングする
    /// @param serial ミラー対象の Stream (通常は Serial)
    /// 呼出後、serial への write がTCPクライアントにも送信される
    void mirror(Stream& serial);

    /// ミラーリングを解除する
    void unmirror();

    /// ミラーリングが有効かどうか
    bool isMirroring() const;

    // ========== Direct Output ==========
    // Print インターフェース実装
    // wirelessSerial.println("直接送信") のように使える

    size_t write(uint8_t byte) override;
    size_t write(const uint8_t* buffer, size_t size) override;

    // ========== Status ==========

    /// 接続中のクライアント数
    uint8_t clientCount() const;

    /// サーバーが稼働中かどうか
    bool isRunning() const;

    // ========== Configuration ==========

    /// 最大クライアント数を設定 (default: 3, max: 5)
    void setMaxClients(uint8_t maxClients);
};
```

### 3.3 Mirror Mode Implementation Strategy

Arduinoの `Print` / `Stream` クラスはvirtualメソッドを持つが、`Serial` の `write()` を直接フックすることはできない。

**実装方式: DualPrint Wrapper**

```cpp
/// Serial と WirelessSerial の両方に同時出力する Print ラッパー
class DualPrint : public Print {
public:
    DualPrint(Print& primary, Print& secondary);

    size_t write(uint8_t byte) override {
        primary.write(byte);
        return secondary.write(byte);
    }

    size_t write(const uint8_t* buffer, size_t size) override {
        primary.write(buffer, size);
        return secondary.write(buffer, size);
    }

private:
    Print& _primary;   // Serial (USB)
    Print& _secondary;  // WirelessSerial (TCP)
};
```

**ユーザーの使い方 (mirror モード)**:

```cpp
WirelessSerial ws;
DualPrint dualOut(Serial, ws);

void setup() {
    Serial.begin(115200);
    WiFi.begin(ssid, password);
    ws.begin();
}

void loop() {
    ws.handle();
    dualOut.println("This goes to both Serial and TCP");
}
```

**より簡易なAPI (推奨)**:

```cpp
WirelessSerial ws;

void setup() {
    Serial.begin(115200);
    WiFi.begin(ssid, password);
    ws.begin();
    ws.mirror(Serial);  // 内部で DualPrint を構築
}

void loop() {
    ws.handle();
    Serial.println("This goes to both Serial and TCP automatically");
    // ↑ mirror() 呼出後は Serial の出力先が DualPrint に切り替わる
}
```

> **Note**: `Serial` オブジェクト自体の `write()` をオーバーライドすることはHardwareSerialの制約上不可能。
> 代替として、`ws.mirror(Serial)` は内部的にグローバルな出力ストリームを切り替える方式を採用する。
> 具体的な実装は、Arduinoプラットフォームの Print リダイレクト機構を調査の上で決定する。
> 最悪のケースでは、ユーザーに `Serial.println()` の代わりに `ws.println()` を使ってもらう (フォールバック方式)。

### 3.4 Example Sketches

#### Example 1: BasicMirror.ino
```
WiFi STA Mode で接続 → Serial出力をTCPにミラー
最もシンプルな使用例
```

#### Example 2: APModeMirror.ino
```
WiFi AP Mode で動作 → 192.168.4.1:23 でシリアルモニター
SSIDが設定されていない初期設定時のデバッグ用
（next_crm プロジェクトのESP8266のユースケース）
```

#### Example 3: ESP32BothModes.ino
```
ESP32のWiFi AP+STA同時モード → どちらからも接続可能
```

#### Example 4: CustomPort.ino
```
カスタムポート・カスタムmDNS名で動作
```

### 3.5 Memory Footprint Target

| Platform | RAM Usage | Flash Usage |
|----------|-----------|-------------|
| ESP8266 | < 2KB (excluding WiFi) | < 8KB |
| ESP32 | < 2KB (excluding WiFi) | < 8KB |

ESP8266のRAMは80KBしかないため、ライブラリのメモリ使用量は最小限に抑える。

### 3.6 library.properties
```
name=WirelessSerial
version=1.0.0
author=Serial Air Team
maintainer=Serial Air Team
sentence=Wireless serial monitor over WiFi TCP with iOS companion app.
paragraph=Mirror your Arduino Serial output to iPhone/iPad over WiFi. Works with ESP8266 and ESP32. Companion iOS app "Serial Air" available on App Store.
category=Communication
url=https://github.com/{username}/serial-air
architectures=esp8266,esp32
includes=WirelessSerial.h
depends=
```

---

## 4. iOS App — Serial Air

### 4.1 App Overview

| 項目 | 内容 |
|------|------|
| App Name | Serial Air |
| Platform | iOS 16.0+ |
| Framework | React Native + Expo (TypeScript) |
| Build | Expo Development Build (EAS Build) |
| Distribution | App Store |
| License | MIT (ソースコード) |

### 4.2 Technology Stack

| 技術 | 用途 |
|------|------|
| React Native | クロスプラットフォームフレームワーク |
| Expo SDK | 開発環境・ビルドツールチェーン |
| TypeScript | 型安全な開発 |
| react-native-tcp-socket | TCP接続 |
| react-native-zeroconf | mDNS/Bonjour自動検出 |
| zustand | 状態管理 |
| expo-file-system | ログファイル保存 |
| expo-sharing | ログ共有 |
| expo-haptics | 触覚フィードバック |
| react-native-reanimated | アニメーション |
| @expo/vector-icons | アイコン |

### 4.3 Screen Design

#### Screen 1: Home (デバイス一覧)

```
┌──────────────────────────────────────┐
│  Serial Air                     ⚙️   │
│──────────────────────────────────────│
│                                      │
│  📡 Discovered Devices               │
│                                      │
│  ┌──────────────────────────────────┐│
│  │  🟢 esp-serial                   ││
│  │  192.168.4.1:23 • ESP8266        ││
│  │  Signal: ████░░ -45dBm           ││
│  └──────────────────────────────────┘│
│                                      │
│  ┌──────────────────────────────────┐│
│  │  🟢 living-room-sensor           ││
│  │  192.168.1.105:23 • ESP32        ││
│  │  Signal: ██████ -30dBm           ││
│  └──────────────────────────────────┘│
│                                      │
│  ┌──────────────────────────────────┐│
│  │  🔴 garage-temp (offline)        ││
│  │  192.168.1.120:23 • ESP8266      ││
│  │  Last seen: 5 min ago            ││
│  └──────────────────────────────────┘│
│                                      │
│──────────────────────────────────────│
│  Manual Connection                   │
│  ┌──────────┐ ┌─────┐               │
│  │ IP Address│ │ Port│               │
│  └──────────┘ └─────┘               │
│              [ Connect ]             │
│                                      │
│  Recent Connections                  │
│  • 192.168.4.1:23 (2h ago)          │
│  • 192.168.1.105:23 (yesterday)     │
│                                      │
└──────────────────────────────────────┘
```

**機能**:
- mDNS自動検出されたデバイスをリスト表示
- オンライン/オフラインステータス表示
- 手動IP:Port入力による接続
- 接続履歴 (最近使用したデバイス)
- デバイスカードタップで Monitor 画面へ遷移

#### Screen 2: Monitor (シリアルモニター)

```
┌──────────────────────────────────────┐
│  ← esp-serial          🟢 Connected │
│──────────────────────────────────────│
│  🔍 Filter: [                     ] │
│──────────────────────────────────────│
│                                      │
│  10:23:01.123  > Boot complete       │
│  10:23:01.456  > WiFi connected      │
│  10:23:02.001  > IP: 192.168.4.1    │
│  10:23:05.234  > Temperature: 25.3°C │
│  10:23:05.235  > Humidity: 60.2%     │
│  10:23:10.567  > [OTA] Checking...   │
│  10:23:11.890  > [OTA] Up to date    │
│  10:23:15.234  > Temperature: 25.4°C │
│  10:23:15.235  > Humidity: 60.1%     │
│  10:23:25.234  > Temperature: 25.3°C │
│  10:23:25.235  > Humidity: 60.3%     │
│  10:23:25.236  > Heap: 32456 bytes   │
│                                      │
│                          ▼ Auto ↓    │
│──────────────────────────────────────│
│  Lines: 12  │  ⏸  │  📋  │  💾  │  🗑  │
│──────────────────────────────────────│
│  [ Send command...              ] ➤  │
└──────────────────────────────────────┘
```

**機能**:
- リアルタイムログ表示 (自動スクロール)
- タイムスタンプ自動付与 (iOS側で付与、ミリ秒精度)
- テキストフィルター (リアルタイム検索)
- 自動スクロール ON/OFF トグル
- ⏸ 一時停止 (受信は継続、表示を停止)
- 📋 クリップボードにコピー (選択 or 全文)
- 💾 ログファイル保存 (.txt) + 共有
- 🗑 ログクリア
- コマンド送信 (デバイスへのテキスト送信、双方向通信)
- 行数カウンター表示
- 接続状態インジケーター (Connected / Reconnecting / Disconnected)

#### Screen 3: Settings (設定)

```
┌──────────────────────────────────────┐
│  ← Settings                          │
│──────────────────────────────────────│
│                                      │
│  Display                             │
│  ├── Font Size          [14pt ▾]     │
│  ├── Timestamp          [ON  🔘]     │
│  ├── Auto-scroll        [ON  🔘]     │
│  ├── Max Lines          [10000 ▾]    │
│  └── Color Theme        [Dark ▾]     │
│                                      │
│  Connection                          │
│  ├── Default Port       [23   ]      │
│  ├── Auto-reconnect     [ON  🔘]     │
│  ├── Reconnect Interval [5s   ▾]    │
│  └── Connection Timeout [10s  ▾]    │
│                                      │
│  Log                                 │
│  ├── Auto-save          [OFF 🔘]     │
│  ├── Save Directory     [Documents] │
│  └── Max File Size      [10MB ▾]    │
│                                      │
│  About                               │
│  ├── Version            1.0.0        │
│  ├── Arduino Library    ↗            │
│  ├── Documentation      ↗            │
│  ├── GitHub             ↗            │
│  └── Rate this app      ⭐            │
│                                      │
└──────────────────────────────────────┘
```

### 4.4 State Management (Zustand)

```typescript
// stores/useConnectionStore.ts
interface ConnectionStore {
  // Connection state
  status: 'disconnected' | 'connecting' | 'connected' | 'reconnecting';
  currentDevice: Device | null;
  error: string | null;

  // Actions
  connect: (host: string, port: number) => Promise<void>;
  disconnect: () => void;
  sendCommand: (command: string) => void;
}

// stores/useLogStore.ts
interface LogStore {
  // Log state
  lines: LogLine[];
  isPaused: boolean;
  filter: string;
  filteredLines: LogLine[];

  // Actions
  addLine: (text: string) => void;
  clear: () => void;
  togglePause: () => void;
  setFilter: (filter: string) => void;
  exportLog: () => Promise<string>;
}

// stores/useDiscoveryStore.ts
interface DiscoveryStore {
  // Discovery state
  devices: Device[];
  isScanning: boolean;
  recentConnections: RecentConnection[];

  // Actions
  startScan: () => void;
  stopScan: () => void;
  addRecentConnection: (connection: RecentConnection) => void;
}

// types
interface Device {
  name: string;
  host: string;
  port: number;
  deviceType?: string;       // from mDNS TXT record
  libraryVersion?: string;   // from mDNS TXT record
  isOnline: boolean;
  lastSeen: Date;
}

interface LogLine {
  id: number;
  timestamp: Date;
  text: string;
  raw: string;
}

interface RecentConnection {
  host: string;
  port: number;
  deviceName?: string;
  lastConnected: Date;
}
```

### 4.5 TCP Connection Service

```typescript
// services/TcpConnection.ts

interface TcpConnectionOptions {
  host: string;
  port: number;
  timeout?: number;         // Connection timeout (ms), default: 10000
  reconnect?: boolean;      // Auto-reconnect, default: true
  reconnectInterval?: number; // Reconnect interval (ms), default: 5000
}

interface TcpConnectionEvents {
  onConnect: () => void;
  onData: (data: string) => void;
  onError: (error: Error) => void;
  onClose: () => void;
  onReconnecting: (attempt: number) => void;
}
```

**処理フロー**:
1. `react-native-tcp-socket` で TCP ソケットを作成
2. 指定 host:port に接続
3. データ受信時: UTF-8 デコード → 改行区切りで分割 → LogStore に追加
4. 切断時: auto-reconnect が有効なら一定間隔で再接続試行
5. コマンド送信: テキスト + `\n` をソケットに書き込み

### 4.6 mDNS Discovery Service

```typescript
// services/DeviceDiscovery.ts

// react-native-zeroconf を使用
// Service Type: "_serial-air._tcp."
// Bonjour はiOSネイティブ対応のため高速・省電力

interface DiscoveryService {
  startScan(): void;       // スキャン開始
  stopScan(): void;        // スキャン停止
  onDeviceFound: (device: Device) => void;
  onDeviceLost: (device: Device) => void;
}
```

### 4.7 Performance Requirements

| 項目 | 要件 |
|------|------|
| Log Display Latency | < 50ms (データ受信から画面表示まで) |
| Max Log Lines (in memory) | 10,000 (設定で変更可) |
| Max Log Lines (saved file) | 制限なし |
| FlatList Render | Virtualized (画面内の行のみレンダリング) |
| Reconnection Time | < 5s (自動再接続) |
| mDNS Discovery | < 3s (LAN内デバイス検出) |
| Memory Usage | < 100MB (10,000行保持時) |
| Battery Impact | Minimal (TCP idle時は低消費) |

### 4.8 App Store Metadata

```
App Name: Serial Air
Subtitle: Wireless Serial Monitor
Category: Utilities / Developer Tools
Price: Free

Keywords:
serial monitor, arduino, esp8266, esp32, iot, wireless debug,
tcp serial, microcontroller, embedded, serial terminal

Description (EN):
Serial Air turns your iPhone into a wireless serial monitor for
Arduino, ESP8266, ESP32, and other WiFi-enabled microcontrollers.

Features:
• Automatic device discovery via Bonjour/mDNS
• Real-time serial output with timestamps
• Manual IP:Port connection
• Text search and filtering
• Log export and sharing
• Command sending (bidirectional)
• Auto-reconnection
• Dark mode support

Works with the free "WirelessSerial" Arduino library.
Add just 2 lines of code to your Arduino sketch to start
wireless serial monitoring.

Description (JA):
Serial Airは、Arduino・ESP8266・ESP32のシリアル出力をiPhoneで
ワイヤレスに確認できるアプリです。PCなしでデバイスのデバッグが可能。

Privacy Policy URL: (GitHub Pages)
Support URL: (GitHub Issues)
```

---

## 5. Project Structure

```
serial-air/
├── SPECIFICATION.md          # This file
├── README.md                 # Project overview + quick start
├── LICENSE                   # MIT License
├── .gitignore
│
├── app/                      # React Native (Expo) iOS App
│   ├── app.json              # Expo configuration
│   ├── package.json
│   ├── tsconfig.json
│   ├── eas.json              # EAS Build configuration
│   ├── app/                  # Expo Router (file-based routing)
│   │   ├── _layout.tsx       # Root layout
│   │   ├── index.tsx         # Home screen (device list)
│   │   ├── monitor.tsx       # Monitor screen
│   │   └── settings.tsx      # Settings screen
│   ├── src/
│   │   ├── components/
│   │   │   ├── DeviceCard.tsx
│   │   │   ├── LogViewer.tsx
│   │   │   ├── ConnectionBar.tsx
│   │   │   ├── FilterBar.tsx
│   │   │   ├── CommandInput.tsx
│   │   │   └── ManualConnect.tsx
│   │   ├── services/
│   │   │   ├── TcpConnection.ts
│   │   │   └── DeviceDiscovery.ts
│   │   ├── stores/
│   │   │   ├── useConnectionStore.ts
│   │   │   ├── useLogStore.ts
│   │   │   ├── useDiscoveryStore.ts
│   │   │   └── useSettingsStore.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   ├── formatTimestamp.ts
│   │   │   └── logExporter.ts
│   │   └── constants/
│   │       └── defaults.ts
│   └── assets/
│       └── icon.png
│
├── arduino/                  # Arduino Library
│   └── WirelessSerial/
│       ├── src/
│       │   ├── WirelessSerial.h
│       │   ├── WirelessSerial.cpp
│       │   └── DualPrint.h
│       ├── examples/
│       │   ├── BasicMirror/
│       │   │   └── BasicMirror.ino
│       │   ├── APModeMirror/
│       │   │   └── APModeMirror.ino
│       │   ├── ESP32BothModes/
│       │   │   └── ESP32BothModes.ino
│       │   └── CustomPort/
│       │       └── CustomPort.ino
│       ├── library.properties
│       ├── keywords.txt
│       └── README.md
│
└── docs/                     # Documentation
    ├── setup-guide.md        # Getting started guide
    ├── api-reference.md      # Arduino library API docs
    ├── troubleshooting.md    # Common issues
    └── privacy-policy.md     # App Store requirement
```

---

## 6. Development Roadmap

### v1.0.0 — MVP (Target: App Store公開)

| Phase | 内容 | 成果物 |
|-------|------|--------|
| **Phase 1** | Arduino Library基盤 | WirelessSerial.h/cpp, TCP Server, mDNS |
| **Phase 2** | Expo プロジェクトセットアップ | プロジェクト初期化, ネイティブモジュール設定 |
| **Phase 3** | Device Discovery | mDNS スキャン, デバイスリスト表示 |
| **Phase 4** | TCP接続 + ログ表示 | リアルタイムモニター, 自動スクロール |
| **Phase 5** | 機能実装 | フィルター, コマンド送信, ログ保存 |
| **Phase 6** | 設定画面 + 仕上げ | 設定永続化, Dark Mode, アイコン |
| **Phase 7** | テスト + App Store申請 | TestFlight, App Store審査提出 |

### v1.1.0 — Enhanced
- ANSIカラーコード対応 (ログに色付け)
- 複数デバイス同時接続 (タブ切り替え)
- ログのピン留め / ブックマーク
- ウィジェット (接続状態表示)

### v2.0.0 — BLE Support
- BLE Serial (UART Service) 対応
- ESP32 BLE接続
- BLE自動検出
- 接続方式の自動選択 (WiFi or BLE)

### v2.1.0 — Advanced
- ログのパターンマッチ通知 (特定文字列でプッシュ通知)
- グラフ表示 (数値データのリアルタイムプロット)
- マクロ (よく使うコマンドの保存・実行)
- iPad対応 (Split View)

---

## 7. Technical Considerations

### 7.1 Expo Development Build

Expo GoではネイティブTCPモジュールが使えないため、Development Buildが必要:

```bash
# Development Build作成
npx expo install expo-dev-client
eas build --profile development --platform ios
```

**必要なネイティブモジュール**:
- `react-native-tcp-socket`: TCP接続
- `react-native-zeroconf`: mDNS/Bonjour検出

両方ともExpo Config Pluginに対応しているか確認が必要。
対応していない場合は `expo-prebuild` でネイティブプロジェクトを生成する。

### 7.2 iOS Permissions

```xml
<!-- Info.plist additions -->
<key>NSLocalNetworkUsageDescription</key>
<string>Serial Air uses your local network to discover and connect to microcontrollers for serial monitoring.</string>

<key>NSBonjourServices</key>
<array>
    <string>_serial-air._tcp</string>
</array>
```

### 7.3 ESP8266 Memory Considerations

ESP8266は80KB RAMの制約があるため:
- WiFiServer + 3クライアントで約1.5KB消費
- mDNS Responderで約1KB消費
- Total: ~2.5KB追加メモリ使用
- ユーザーのスケッチとの共存を考慮し、最小限のバッファを使用

### 7.4 Edge Cases

| ケース | 対応 |
|--------|------|
| ESP APモードでiPhoneが接続 | Captive Portal検知を回避する必要あり |
| 高速シリアル出力 (115200baud) | TCP バッファリング + FlatList仮想化 |
| WiFi一時切断 | Auto-reconnect + バッファリング |
| 複数アプリ同時接続 | Max 3クライアントで制限 |
| 長時間接続 | TCP Keep-Alive + iOS background制限考慮 |
| iOS background移行 | 接続を維持するか切断するか設定可能 |

### 7.5 Captive Portal Issue (APモード)

ESP8266がAPモードの時、iOSは「インターネット接続なし」と判断してCaptive Portal画面を表示したり、自動的にセルラーに切り替えることがある。

**対策**:
1. ESP側: Captive Portal用のDNS応答を返す (204 No Content)
2. iOS側: アプリ内でユーザーに「WiFi設定でAP接続を維持」する手順を案内
3. `NEHotspotConfiguration` APIでプログラマティックにWiFi接続する可能性を調査

---

## 8. Testing Strategy

### 8.1 Arduino Library Testing

| テスト | 内容 |
|--------|------|
| Unit | WirelessSerial APIの単体テスト (PlatformIOのUnity) |
| Integration | ESP8266実機 + PCのTelnetクライアントで接続確認 |
| Memory | ヒープ使用量モニタリング (長時間接続テスト) |
| Multi-client | 3クライアント同時接続の安定性 |
| Reconnect | クライアント切断→再接続の繰り返し |

### 8.2 iOS App Testing

| テスト | 内容 |
|--------|------|
| Unit | Services, Stores のユニットテスト (Jest) |
| E2E | Detox or Maestro で画面遷移・接続フロー |
| Mock Server | Node.js TCP サーバーでデバイスをシミュレート |
| Real Device | ESP8266実機との結合テスト |
| Performance | 10,000行ログのスクロールパフォーマンス |
| Network | WiFi切断・再接続のハンドリング |

### 8.3 Mock TCP Server (開発用)

```typescript
// tools/mock-server.ts
// Node.js で ESP8266 の動作をシミュレート
// iOS アプリの開発中にデバイス実機なしでテスト可能
import net from 'net';

const server = net.createServer((socket) => {
  setInterval(() => {
    socket.write(`Temperature: ${(20 + Math.random() * 10).toFixed(1)}°C\n`);
    socket.write(`Humidity: ${(40 + Math.random() * 30).toFixed(1)}%\n`);
    socket.write(`Heap: ${Math.floor(30000 + Math.random() * 5000)} bytes\n`);
  }, 1000);
});

server.listen(23, () => console.log('Mock ESP running on port 23'));
```

---

## 9. Success Criteria

### v1.0.0 Release Criteria

- [ ] Arduino Library がESP8266/ESP32で動作する
- [ ] iOSアプリがmDNSでデバイスを自動検出できる
- [ ] TCP接続でリアルタイムにシリアルログが表示される
- [ ] ログの検索・保存・共有ができる
- [ ] コマンド送信（双方向通信）が動作する
- [ ] 自動再接続が正常に機能する
- [ ] 10,000行のログを60FPSでスクロールできる
- [ ] App Store審査に合格する
- [ ] Arduino Library Manager に登録される

### KPI (公開後)

| 指標 | 目標 (3ヶ月) |
|------|-------------|
| App Store Downloads | 500+ |
| Arduino Library Stars | 50+ |
| App Store Rating | 4.0+ |
| Crash Rate | < 1% |
