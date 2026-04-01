# Serial Air — ランディングページ制作指示書

## 概要

Serial Air は、WiFi / Bluetooth 経由でマイクロコントローラのシリアル出力を iPhone でリアルタイムにモニタリングするiOSアプリ。ケーブル不要の無線シリアルモニター。

**ターゲットユーザー**: Arduino / ESP32 / Raspberry Pi を使う開発者・メイカー・IoTエンジニア・学生

**LP URL**: `umemasait.com/serial-air/` （Next.js ポートフォリオサイトの `public/serial-air/index.html`）

---

## LP の目的

1. App Store ダウンロードへの誘導
2. Arduino ライブラリのインストール案内
3. Web コードジェネレーターへの誘導
4. 製品の信頼性・セキュリティへの安心感

---

## 必須ページ・リンク

| パス | 内容 | 状態 |
|------|------|------|
| `/serial-air/index.html` | **LP（メイン）** | 作成対象 |
| `/serial-air/codegen.html` | Web コードジェネレーター | ✅ 作成済み |
| `/serial-air/privacy.html` | プライバシーポリシー | ✅ 作成済み |
| `/serial-air/terms.html` | 利用規約 | ✅ 作成済み |

---

## LP セクション構成

### 1. ヒーロー
- **キャッチコピー**: 「Wireless Serial Monitor for Your Phone」/ 「ケーブルなしで、シリアルモニター」
- アプリアイコン + スクリーンショット（iPhone モックアップ）
- **App Store ダウンロードバッジ**
- **無料**であることを明示

### 2. 課題提起
- ケーブルに繋がれたデバッグ環境の不便さ
- Arduino IDE のシリアルモニターの限界（モバイル非対応、グラフなし）

### 3. 解決策 / 機能紹介

| 機能 | 説明 |
|------|------|
| **WiFi シリアルモニター** | TCP 接続でリアルタイムログ表示 |
| **BLE 対応** | Bluetooth Low Energy で ESP32 と直接通信 |
| **シリアルプロッター** | 数値データをリアルタイムグラフ表示（モニター内トグル切替） |
| **コマンドマクロ** | よく使うコマンドを保存、ワンタップ送信 |
| **デバイス自動検出** | mDNS / BLE スキャンで自動発見 |
| **コードジェネレーター** | 6 種類のボード対応、セキュリティ設定込み |
| **セキュリティ** | ペアリングコード / パスワード認証 / デバイス指紋 |
| **多言語** | 日本語 / 英語自動切替 |

### 4. 対応デバイス

| ボード | WiFi | BLE |
|--------|------|-----|
| ESP8266 (NodeMCU, Wemos D1 Mini) | ✅ | — |
| ESP32 / C3 / S3 | ✅ | ✅ |
| Arduino Nano ESP32 | ✅ | ✅ |
| M5Stack / Seeed XIAO ESP32 | ✅ | ✅ |
| Arduino UNO R4 WiFi | ✅ | — |
| Arduino + ESP-01 | ✅ | — |
| Raspberry Pi Pico W | ✅ | — |
| Raspberry Pi 3/4/5 | ✅ | — |
| Orange Pi / Banana Pi | ✅ | — |

### 5. セットアップ手順（3ステップ）

```
Step 1: ライブラリをインストール
  → GitHub リンク + IDE 別ガイド（Arduino IDE / PlatformIO / CLI）

Step 2: テストコードをアップロード
  → Web コードジェネレーターへのリンクボタン
  → 「PCでコーディング → codegen.html」

Step 3: アプリで接続
  → App Store ダウンロード → デバイスをタップして接続
```

### 6. Web コードジェネレーター CTA
- 大きなボタン: 「Generate Code for Your Board」/ 「テストコードを生成」
- → `/serial-air/codegen.html` へリンク

### 7. セキュリティ
- 通信方式の説明（TCP / BLE、ローカルネットワークのみ）
- データはデバイス上にのみ保存、サーバーなし
- オプションのペアリング / パスワード認証
- Privacy Policy / Terms of Service へのリンク

### 8. 価格
- **無料**（v1.0）
- 将来的に Pro 機能（$1.99 買い切り）の可能性を示唆してもよい

### 9. フッター
- GitHub リンク: `github.com/matdonaruno/serial-air`
- Arduino ライブラリ: `github.com/matdonaruno/serial-air/tree/main/arduino/WirelessSerial`
- Privacy Policy / Terms of Service
- © 2026 Masashi Umetani

---

## デザイン指示

### カラースキーム
```
背景:        #050510（深い紺〜黒）
サーフェス:   rgba(255,255,255,0.03)
アクセント:   #FF6B35（オレンジ）
シアン:       #00d2ff（サブアクセント、技術感）
テキスト:     #E8E8F0（メイン）、#AAAABE（セカンダリ）
```

### スタイル
- グラスモーフィズム（backdrop-filter: blur）
- 角丸カード（border-radius: 16-30px）
- パーティクルアニメーション背景（既存 privacy/terms と同じ）
- Montserrat + Noto Sans JP フォント
- モバイルファースト、レスポンシブ

### 既存ページとの統一
- `privacy.html` / `terms.html` / `codegen.html` と同じデザインシステム
- Labo Voice LP (`/Users/umetanimasashi/Documents/Labo_Voice/docs/`) を参考

---

## 多言語対応

- 英語 / 日本語のタブ切替（ブラウザ言語自動検出）
- 既存の privacy.html / terms.html / codegen.html と同じ方式

---

## アセット

| アセット | 場所 |
|---------|------|
| アプリアイコン | `app/assets/icon.png` (1024x1024) |
| スプラッシュ | `app/assets/splash.png` |
| スクリーンショット素材 | `docs/store-listing/` |

---

## 技術情報

- 静的 HTML + CSS + JS（フレームワーク不要）
- ホスティング: Netlify（`umemasait.com` ポートフォリオサイトの `public/serial-air/`）
- GitHub リポジトリ: `github.com/matdonaruno/serial-air`
- `git push` で自動デプロイ

---

## App Store 情報

- アプリ名: Serial Air
- バンドルID: com.serialair.app
- 価格: 無料（FREE_MODE）
- カテゴリ: Developer Tools / Utilities
- 対応: iOS 16+、iPhone

---

## リンクまとめ

```
LP:              umemasait.com/serial-air/
コードジェネ:     umemasait.com/serial-air/codegen.html
プライバシー:     umemasait.com/serial-air/privacy.html
利用規約:         umemasait.com/serial-air/terms.html
GitHub:          github.com/matdonaruno/serial-air
Arduino Library: github.com/matdonaruno/serial-air/tree/main/arduino/WirelessSerial
```
