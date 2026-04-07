# Serial Air — 次回対応TODO

## BLE ファースト対応
- [ ] テストコードのデフォルトをBLE接続に（WiFiはオプション）
- [ ] コードジェネレーター: BLEモード（WS_NO_BLE無し）をデフォルト選択
- [ ] コードジェネレーター: WiFiモード選択時に `#define WS_NO_BLE 1` を案内
- [ ] オンボーディング: 「まずはBLEで試しましょう」のスライド追加
- [ ] LP: BLE接続を先にアピール

## WiFi接続の注意点をユーザーに伝える
- WiFi使用時はBLEを無効に（`#define WS_NO_BLE 1`）→ ヒープ圧迫回避
- mDNSは環境によって不安定 → 手動IP接続をフォールバックとして案内
- WPA（非WPA2）ルーターは `setMinSecurity()` が必要

## App Store提出
- [ ] スクリーンショット（iPhone + Android）
- [ ] デモ動画（BLE接続フロー）
- [ ] App Store Connect メタデータ入力
- [ ] eas.json Apple ID情報記入
- [ ] プロダクションビルド＆提出

## Google Play提出
- [ ] Google Play Consoleデベロッパー登録（$25）
- [ ] EASプロダクションビルド（AAB）
- [ ] ストアリスティング入力
- [ ] プライバシーポリシー設定

## mDNS改善（将来）
- 安定したWiFi環境でiPhone実機テスト
- react-native-zeroconfのAndroid対応確認
- フォールバック: 手動IP入力のUX改善
