# Serial Air — ローカル開発ガイド

このドキュメントはSerial Airプロジェクトをローカル環境で開発するための完全ガイドです。

---

## 目次

1. [前提条件](#1-前提条件)
2. [リポジトリセットアップ](#2-リポジトリセットアップ)
3. [iOSアプリ開発](#3-iosアプリ開発)
4. [Arduinoライブラリ](#4-arduinoライブラリ)
5. [Webサイト (Netlify)](#5-webサイト-netlify)
6. [App Store公開準備](#6-app-store公開準備)
7. [プロジェクト構成](#7-プロジェクト構成)
8. [アーキテクチャ](#8-アーキテクチャ)
9. [よくある問題](#9-よくある問題)

---

## 1. 前提条件

### 必須ツール

| ツール | バージョン | 用途 |
|--------|-----------|------|
| **Node.js** | 18+ | React Nativeビルド |
| **npm** | 9+ | パッケージ管理 |
| **Xcode** | 15+ | iOSネイティブビルド |
| **CocoaPods** | 1.14+ | iOS依存関係管理 |
| **EAS CLI** | 12+ | Expo Application Services |
| **Arduino IDE** | 2.x | Arduinoライブラリ開発 |
| **Git** | 2.x | バージョン管理 |

### インストール

```bash
# EAS CLI
npm install -g eas-cli

# CocoaPods (macOS)
sudo gem install cocoapods

# Xcode Command Line Tools
xcode-select --install
```

### アカウント

| サービス | 必要なもの | 用途 |
|----------|-----------|------|
| **Apple Developer** | $99/年 | 実機テスト・App Store公開 |
| **Expo** | 無料アカウント | EAS Build |
| **App Store Connect** | Apple Developer内 | IAP設定・アプリ提出 |
| **Netlify** | 無料アカウント | Webサイトホスティング |

---

## 2. リポジトリセットアップ

```bash
# クローン
git clone https://github.com/matdonaruno/serial-air.git
cd serial-air

# 開発ブランチに切り替え
git checkout claude/setup-serial-air-Q9MrK
```

---

## 3. iOSアプリ開発

### 3.1 セットアップ

```bash
cd app

# 依存関係インストール (zeroconfのpeer dep警告を回避)
npm install --legacy-peer-deps
```

### 3.2 Development Build (必須)

**重要**: Expo Goでは動作しません。`react-native-tcp-socket` と `react-native-iap` がネイティブモジュールのため、Development Buildが必須です。

```bash
# Expoにログイン
npx eas login

# iOSシミュレータ用ビルド
npx eas build --profile development --platform ios

# または、ローカルでprebuild → Xcodeでビルド
npx expo prebuild --platform ios
cd ios && pod install && cd ..
npx expo run:ios
```

### 3.3 実機テスト

```bash
# 実機用Development Build
npx eas build --profile development --platform ios --no-wait

# ビルド完了後、QRコードまたはリンクからインストール
# Apple Developer Accountで実機のUDIDを登録しておくこと
```

### 3.4 Mock Server (ハードウェアなしで開発)

ESP実機がなくてもアプリの開発・テストが可能です。

```bash
# 別ターミナルで起動
node tools/mock-server.js
# → Mock ESP device running on port 23

# アプリから接続
# Home画面 → Manual Connect → PCのローカルIPアドレス:23
```

Mock Serverは以下をシミュレートします:
- 2秒ごとに温度・湿度・ヒープサイズを送信
- コマンド受信 → エコーバック
- 複数クライアント同時接続

### 3.5 TypeScriptチェック

```bash
cd app
npx tsc --noEmit
```

### 3.6 app.json の設定変更

ローカル開発時に変更が必要な箇所:

```jsonc
// app.json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.yourname.serial-air"  // ← 自分のものに変更
    },
    "android": {
      "package": "com.yourname.serialair"             // ← 自分のものに変更
    }
  }
}
```

### 3.7 eas.json の設定変更

App Store提出時に必要:

```jsonc
// eas.json → submit.production.ios
{
  "appleId": "your@email.com",        // Apple ID
  "ascAppId": "1234567890",           // App Store Connect App ID
  "appleTeamId": "ABCDE12345"         // Apple Developer Team ID
}
```

### 3.8 技術スタック

| 技術 | バージョン | 用途 |
|------|-----------|------|
| Expo SDK | 52 | 開発環境 |
| React Native | 0.76.6 | UIフレームワーク |
| TypeScript | 5.3 | 型安全 |
| Expo Router | 4.0 | ファイルベースルーティング |
| Zustand | 5.0 | 状態管理 |
| react-native-tcp-socket | 6.2 | TCP通信 |
| react-native-zeroconf | 0.14 | mDNS/Bonjour検出 |
| react-native-iap | 12.15 | アプリ内課金 (StoreKit) |
| react-native-reanimated | 3.16 | アニメーション |
| expo-haptics | 14.0 | 触覚フィードバック |

---

## 4. Arduinoライブラリ

### 4.1 ライブラリのインストール (開発用)

```bash
# macOS
cp -r arduino/WirelessSerial ~/Documents/Arduino/libraries/

# Windows
# arduino/WirelessSerial を Documents\Arduino\libraries\ にコピー

# Linux
cp -r arduino/WirelessSerial ~/Arduino/libraries/
```

Arduino IDEを再起動すると `ファイル → スケッチ例 → WirelessSerial` にサンプルが表示されます。

### 4.2 サンプルスケッチ

| スケッチ | ボード | 説明 |
|----------|--------|------|
| `BasicMirror.ino` | ESP8266/ESP32 | WiFi STA接続、Serial出力のTCPミラー |
| `APModeMirror.ino` | ESP8266/ESP32 | WiFi APモード、直接接続で使用 |
| `ESP32BothModes.ino` | ESP32のみ | AP+STA同時モード |
| `CustomPort.ino` | ESP8266/ESP32 | ポート・mDNS名のカスタマイズ |

### 4.3 ライブラリ構成

```
arduino/WirelessSerial/
├── src/
│   ├── WirelessSerial.h      # メインヘッダー
│   ├── WirelessSerial.cpp     # TCP Server + mDNS実装
│   └── DualPrint.h            # Serial+TCPデュアル出力ラッパー
├── examples/                  # 4つのサンプルスケッチ
├── library.properties         # Arduino Library Manager用メタデータ
└── keywords.txt               # IDE構文ハイライト定義
```

### 4.4 対応ボード

| ボード | チップ | WiFi | BLE | 状態 |
|--------|--------|------|-----|------|
| ESP8266 (NodeMCU, D1 Mini等) | ESP8266 | Yes | No | v1.0対応 |
| ESP32 | ESP32 | Yes | Yes (v2.0) | v1.0対応 |
| ESP32-C3 | ESP32-C3 | Yes | Yes (v2.0) | v1.0対応 |
| ESP32-C6 | ESP32-C6 | Yes | Yes (v2.0) | v1.0対応 |

### 4.5 テスト方法

```bash
# PC側でtelnetで接続テスト
telnet <ESP_IP_ADDRESS> 23

# または mock-server でアプリ側をテスト
node tools/mock-server.js
```

---

## 5. Webサイト (Netlify)

### 5.1 ローカルプレビュー

```bash
cd website

# 簡易HTTPサーバー
npx serve .
# → http://localhost:3000

# または Netlify CLI
npm install -g netlify-cli
netlify dev
# → http://localhost:8888
```

### 5.2 ページ構成

| ファイル | URL | 内容 |
|----------|-----|------|
| `index.html` | `/` | ランディングページ |
| `howto.html` | `/howto` | セットアップガイド |
| `privacy.html` | `/privacy` | プライバシーポリシー |
| `terms.html` | `/terms` | 利用規約 |

### 5.3 Netlifyデプロイ

```bash
# 初回: Netlify CLIでサイト作成
cd website
netlify init
# → Create & configure a new site を選択
# → Deploy directory: . (current directory)

# デプロイ
netlify deploy --prod

# または GitHub連携で自動デプロイ
# Netlifyダッシュボードで website/ をPublish directoryに設定
```

`netlify.toml` でクリーンURL (`/howto` → `howto.html`) のリダイレクトが設定済み。

### 5.4 App Storeスクリーンショット

```bash
# スクリーンショットモックアップを確認
open website/screenshots/01-home.html
# → Chromeで開いてスクリーンショットを撮影

# 5枚のモックアップ:
# 01-home.html     — デバイス一覧画面
# 02-monitor.html  — シリアルモニター画面
# 03-codegen.html  — コードジェネレーター画面
# 04-paywall.html  — 購入画面
# 05-settings.html — 設定画面

# マーケティング用合成画像
open website/screenshots/stitch.html
```

### 5.5 画像生成プロンプト

`docs/store-listing/image-gen-prompts.md` に以下のプロンプトが用意されています:
- アプリアイコン (Midjourney/DALL-E用)
- App Storeヒーローバナー
- SNS用OGPカード
- ライフスタイル写真

---

## 6. App Store公開準備

### 6.1 IAP (アプリ内課金) 設定

アプリは **買い切り $1.99** + **7日間無料トライアル** のモデルです。

**RevenueCatは使用していません。** Apple StoreKit / Google Play Billing を `react-native-iap` で直接利用しています。

#### App Store Connect設定

1. [App Store Connect](https://appstoreconnect.apple.com) にログイン
2. アプリを作成
3. `機能` → `App内課金` → `+` ボタン
4. 以下の設定で作成:

| 項目 | 値 |
|------|-----|
| 種類 | 非消耗型 (Non-consumable) |
| 参照名 | Serial Air Pro |
| 製品ID | `serial_air_pro` |
| 価格 | $1.99 (Tier 2) / ¥400 |

5. ローカライズ情報を追加 (表示名、説明)
6. スクリーンショットを添付 (審査用)
7. `送信の準備ができました` にする

#### コード側

`app/src/services/PurchaseService.ts` の `PRODUCT_ID` が `serial_air_pro` に設定済みです。App Store Connectの製品IDと一致していれば動作します。

### 6.2 トライアル

7日間の無料トライアルは **ローカル (AsyncStorage)** で管理しています。Apple Subscriptionのトライアルではありません。

- 初回起動時に `serial-air:trial-start` に日時を保存
- 7日経過後、未購入なら接続時にPaywall画面を表示
- 購入後は `serial-air:purchased = true` で永久アクセス

### 6.3 EAS Build & Submit

```bash
cd app

# プロダクションビルド
npx eas build --platform ios --profile production

# App Storeに提出
npx eas submit --platform ios
```

### 6.4 App Store説明文

`docs/store-listing/app-store-text.md` に英語・日本語の説明文、キーワード、カテゴリ情報が用意されています。

### 6.5 チェックリスト

```
□ Apple Developer Account 有効
□ App Store Connect でアプリ作成
□ Bundle Identifier を自分のものに変更 (app.json)
□ IAP製品 serial_air_pro を作成
□ アプリアイコン作成 (1024x1024)
□ スプラッシュ画像作成
□ スクリーンショット 5枚 (6.7", 6.5", 5.5")
□ 説明文・キーワード入力
□ プライバシーポリシーURL設定 (Netlify)
□ eas.json に Apple ID/Team ID 設定
□ EAS Build → Submit
□ TestFlightでテスト
□ 審査に提出
```

---

## 7. プロジェクト構成

```
serial-air/
├── CLAUDE.md                   # Claude Code用設定
├── DESIGN.md                   # デザインシステム (Dark Neumorphism)
├── DEVELOPMENT.md              # このファイル
├── SPECIFICATION.md            # 製品仕様書
├── README.md                   # プロジェクト概要
│
├── app/                        # React Native (Expo) iOS アプリ
│   ├── app.json                # Expo設定
│   ├── eas.json                # EAS Build設定
│   ├── package.json            # 依存関係
│   ├── tsconfig.json           # TypeScript設定
│   ├── app/                    # 画面 (Expo Routerファイルベース)
│   │   ├── _layout.tsx         # ルートレイアウト
│   │   ├── (tabs)/             # タブナビゲーション
│   │   │   ├── _layout.tsx     # タブレイアウト
│   │   │   ├── index.tsx       # Home (デバイス一覧)
│   │   │   ├── settings.tsx    # 設定画面
│   │   │   ├── monitor.tsx     # シリアルモニター (タブ内)
│   │   │   └── analytics.tsx   # 分析画面
│   │   ├── monitor.tsx         # シリアルモニター (フル画面)
│   │   ├── paywall.tsx         # 購入画面 (モーダル)
│   │   ├── code-generator.tsx  # Arduinoコード生成
│   │   ├── onboarding.tsx      # 初回起動チュートリアル
│   │   ├── device-settings.tsx # デバイス個別設定
│   │   └── firmware-update.tsx # ファームウェア更新
│   └── src/
│       ├── components/         # UIコンポーネント
│       │   ├── neumorphic/     # ニューモーフィック共通コンポーネント
│       │   │   ├── NeuButton.tsx
│       │   │   ├── NeuCard.tsx
│       │   │   ├── NeuContainer.tsx
│       │   │   ├── NeuInput.tsx
│       │   │   ├── NeuToggle.tsx
│       │   │   └── index.ts
│       │   ├── CommandInput.tsx
│       │   ├── ConnectionBar.tsx
│       │   ├── DeviceCard.tsx
│       │   ├── FilterBar.tsx
│       │   ├── LogViewer.tsx
│       │   └── ManualConnect.tsx
│       ├── services/           # ビジネスロジック
│       │   ├── TcpConnection.ts    # TCP通信
│       │   ├── DeviceDiscovery.ts  # mDNSデバイス検出
│       │   ├── PurchaseService.ts  # IAP (react-native-iap)
│       │   ├── ReviewService.ts    # App Storeレビュー依頼
│       │   └── UpdateService.ts    # OTAアップデート
│       ├── stores/             # Zustand状態管理
│       │   ├── useConnectionStore.ts
│       │   ├── useDiscoveryStore.ts
│       │   ├── useLogStore.ts
│       │   ├── useSettingsStore.ts
│       │   ├── usePurchaseStore.ts
│       │   └── useAppStore.ts
│       ├── types/
│       │   ├── index.ts            # 共通型定義
│       │   └── react-native-zeroconf.d.ts
│       ├── constants/
│       │   ├── theme.ts            # カラー・アニメーション定数
│       │   └── defaults.ts         # デフォルト設定値
│       └── utils/
│           ├── formatTimestamp.ts
│           └── logExporter.ts
│
├── arduino/                    # Arduinoライブラリ
│   └── WirelessSerial/
│       ├── src/
│       │   ├── WirelessSerial.h
│       │   ├── WirelessSerial.cpp
│       │   └── DualPrint.h
│       ├── examples/           # 4つのサンプルスケッチ
│       ├── library.properties
│       └── keywords.txt
│
├── website/                    # Netlify静的サイト
│   ├── index.html              # ランディングページ
│   ├── howto.html              # HowToガイド
│   ├── privacy.html            # プライバシーポリシー
│   ├── terms.html              # 利用規約
│   ├── netlify.toml            # Netlify設定
│   ├── css/style.css           # サイトCSS
│   └── screenshots/            # App Storeスクリーンショットモックアップ
│       ├── mockup.css
│       ├── 01-home.html 〜 05-settings.html
│       └── stitch.html         # マーケティング合成画像
│
├── design/                     # UIデザインモックアップ (HTML/PNG)
│
├── docs/
│   ├── setup-guide.md          # ユーザー向けセットアップ
│   ├── api-reference.md        # Arduinoライブラリ API
│   ├── troubleshooting.md      # トラブルシューティング
│   ├── privacy-policy.md       # プライバシーポリシー (MD版)
│   └── store-listing/
│       ├── app-store-text.md   # App Store説明文 (EN/JP)
│       └── image-gen-prompts.md # 画像AI生成プロンプト
│
└── tools/
    ├── mock-server.js          # ESPシミュレートTCPサーバー
    └── mock-server.ts          # TypeScript版
```

---

## 8. アーキテクチャ

### 8.1 通信フロー

```
[ESP8266/ESP32]                    [iPhone / Serial Air App]
     │                                      │
     │  WirelessSerial.begin()              │
     │  → TCP Server起動 (port 23)          │
     │  → mDNS登録 (_serial-air._tcp)       │
     │                                      │
     │              ← mDNS Discovery ──────│ DeviceDiscovery.ts
     │                                      │ (react-native-zeroconf)
     │                                      │
     │              ← TCP Connect ─────────│ TcpConnection.ts
     │                                      │ (react-native-tcp-socket)
     │                                      │
     │  Serial.println("data")             │
     │  → DualPrint → TCP送信               │
     │              ─── "data\n" ──────────→│ useLogStore に追加
     │                                      │ LogViewer で表示
     │                                      │
     │              ← "command\n" ─────────│ CommandInput から送信
     │  → Serial受信                        │
```

### 8.2 状態管理 (Zustand Stores)

| Store | 役割 |
|-------|------|
| `useConnectionStore` | TCP接続状態、接続/切断/コマンド送信 |
| `useDiscoveryStore` | mDNSデバイス検出、接続履歴 |
| `useLogStore` | ログ行管理、フィルター、一時停止、エクスポート |
| `useSettingsStore` | 表示設定 (フォントサイズ、タイムスタンプ等) |
| `usePurchaseStore` | 購入状態、トライアル残日数 |
| `useAppStore` | アプリ全体の状態 |

### 8.3 デザインシステム

**Dark Neumorphism** — 詳細は `DESIGN.md` を参照。

| 要素 | 値 |
|------|-----|
| Background | `#1A1A2E` |
| Surface | `#1E1E32` |
| Accent | `#FF6B35` (オレンジ) |
| Text Primary | `#E0E0E0` |
| Text Secondary | `#8888AA` |
| Font | SF Mono (ログ), SF Pro (UI) |
| Shadow Light | `rgba(255,255,255,0.05)` |
| Shadow Dark | `rgba(0,0,0,0.5)` |
| Border Radius | 16px (カード), 12px (ボタン) |

### 8.4 Haptics

全ボタンに触覚フィードバックを実装済み:

| アクション | 強度 |
|-----------|------|
| ボタンタップ (NeuButton) | Light |
| カードタップ (NeuCard) | Light |
| トグル切替 (NeuToggle) | Light |
| 購入ボタン | Medium |
| 購入完了 | Success Notification |
| 危険操作 (ログクリア等) | Warning |

---

## 9. よくある問題

### Expo Go で動かない

**原因**: `react-native-tcp-socket` と `react-native-iap` はネイティブモジュールで、Expo Goには含まれていません。

**解決**: Development Buildを作成してください → [3.2 Development Build](#32-development-build-必須)

### npm install が失敗する

```bash
# peer dependency の競合を回避
npm install --legacy-peer-deps
```

### TypeScriptエラーが出る

```bash
cd app
npx tsc --noEmit
# エラーが出る場合は node_modules が正しくインストールされているか確認
```

### mDNSでデバイスが見つからない

1. iPhone と ESP が同じWiFiネットワーク上にあるか確認
2. `app.json` に `NSBonjourServices` と `NSLocalNetworkUsageDescription` が設定済み
3. ESPで `ws.begin()` が呼ばれているか確認
4. iOSの「設定 → プライバシー → ローカルネットワーク」でアプリを許可

### APモードで接続できない

iOSがCaptive Portal検出で接続を切ることがあります:
1. iPhoneのWiFi設定 → ESPのAPに接続
2. 「インターネット未接続」と出ても「このネットワークを使用」を選択
3. Serial Airアプリを開いて `192.168.4.1:23` に手動接続

### IAP (課金) のテスト

1. App Store Connect で Sandbox Tester アカウントを作成
2. iPhoneの `設定 → App Store → サンドボックスアカウント` に設定
3. Development Buildでアプリを起動
4. Paywallから購入テスト (課金されません)

### Mock Serverが port 23 で起動できない

port 23は特権ポートのため、macOS/Linuxでは管理者権限が必要:

```bash
sudo node tools/mock-server.js
# または mock-server.js の PORT を 2323 等に変更
```

---

## 開発フロー (推奨)

```
1. Mock Server起動          → node tools/mock-server.js
2. Expo Dev Server起動      → cd app && npx expo start
3. Development Buildで実行   → シミュレータ or 実機
4. コード変更               → Hot Reloadで即反映
5. TypeScriptチェック        → npx tsc --noEmit
6. コミット                 → git add & commit
```
