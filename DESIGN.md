# Serial Air - Design System

## Design Style: Dark Neumorphism

参考デザイン: ダークニューモーフィズム（Soft UI Dark）
音楽プレイヤーUIを参考に、シリアルモニターに最適化したデザインシステム。

---

## 1. Design Principles

| 原則 | 説明 |
|------|------|
| **Depth** | 光と影で要素の浮き沈みを表現。フラットではなく触れる質感 |
| **Monochrome + Accent** | ダークグレー基調 + オレンジアクセント1色 |
| **Soft Edges** | すべての要素に大きな border-radius。角張った要素なし |
| **Emboss / Deboss** | ボタンは浮き出し（emboss）、入力欄は凹み（deboss） |
| **Minimal** | 装飾は影のみ。線やボーダーは使わない |

---

## 2. Color Palette

### Base Colors

```
Background (Primary)    #1A1A2E    メイン背景
Surface (Card)          #1E1E32    カード・コンテナ背景
Surface Light           #252540    ホバー・アクティブ状態
Surface Raised          #2A2A45    浮き出し要素
```

### Shadow Colors

```
Shadow Dark             #12121F    ニューモーフィズム 右下シャドウ
Shadow Light            #252545    ニューモーフィズム 左上ハイライト
Inner Shadow Dark       #101020    凹み要素の内側シャドウ
Inner Shadow Light      #2F2F50    凹み要素の内側ハイライト
```

### Text Colors

```
Text Primary            #E8E8F0    メインテキスト（白に近いグレー）
Text Secondary          #8888A0    サブテキスト（くすんだグレー）
Text Muted              #555570    無効状態・ヒントテキスト
Text Timestamp          #6A6A85    タイムスタンプ
```

### Accent Colors

```
Accent Primary          #FF6B35    メインアクセント（オレンジ）
Accent Active           #FF8855    アクティブ状態（明るいオレンジ）
Accent Glow             #FF6B3540  アクセント要素のグロー（40% opacity）
```

### Status Colors

```
Status Connected        #4ADE80    接続中（グリーン）
Status Connecting       #FBBF24    接続中...（イエロー）
Status Disconnected     #F87171    切断（レッド）
Status Offline          #555570    オフライン（グレー）
```

### Log Level Colors (Monitor画面)

```
Log Default             #E8E8F0    通常テキスト
Log Error               #F87171    [ERROR] 行
Log Warning             #FBBF24    [WARN] 行
Log Info                #60A5FA    [INFO] 行
Log Debug               #8888A0    [DEBUG] 行
Log OTA                 #A78BFA    [OTA] 行
```

---

## 3. Neumorphism Shadows

### Raised Element (浮き出し — ボタン、カード)

```css
/* React Native style */
shadow-offset: { width: -4, height: -4 }   /* 左上ハイライト */
shadow-color: #252545
shadow-opacity: 0.5
shadow-radius: 8

/* + 追加の影 (右下) */
shadow-offset: { width: 4, height: 4 }
shadow-color: #12121F
shadow-opacity: 0.8
shadow-radius: 8
```

React Nativeでは複数shadowが使えないため、実装方法:
- `react-native-shadow-2` ライブラリ使用
- または `LinearGradient` + `View` の組み合わせで再現
- または SVG shadow で実装

```typescript
// Neumorphic raised style
const neumorphicRaised = {
  backgroundColor: '#1E1E32',
  borderRadius: 20,
  // react-native-shadow-2 で実装
  // distance: 6
  // startColor: '#25254540'  (top-left highlight)
  // endColor: '#00000000'
  // offset: [-4, -4]
  // + second shadow layer
  // startColor: '#12121F80'  (bottom-right shadow)
  // offset: [4, 4]
};
```

### Debossed Element (凹み — 入力欄、ログ表示エリア)

```typescript
// Neumorphic debossed (inset) style
const neumorphicDebossed = {
  backgroundColor: '#16162A',
  borderRadius: 16,
  // Inner shadow effect via border + gradient overlay
  borderWidth: 1,
  borderColor: '#12121F',
  // Top-left inner shadow: dark overlay gradient
  // Bottom-right inner highlight: light overlay gradient
};
```

### Pressed State (押下中)

```typescript
// Raised → Debossed に切り替え (touchableの activeOpacity 代替)
const neumorphicPressed = {
  backgroundColor: '#18182C',
  // shadow が反転: 内側に影が入る
};
```

---

## 4. Typography

### Font Family

```
Primary:    System Default (San Francisco on iOS)
Monospace:  "SF Mono", "Menlo", monospace   ← ログ表示用
```

### Font Sizes

```
Title Large     28px    Bold      画面タイトル
Title Medium    22px    Bold      セクションタイトル
Title Small     18px    SemiBold  カードタイトル
Body            16px    Regular   通常テキスト
Body Small      14px    Regular   サブテキスト
Caption         12px    Regular   タイムスタンプ、メタ情報
Log Text        13px    Monospace ログ表示テキスト
Log Timestamp   11px    Monospace ログタイムスタンプ
```

### Letter Spacing

```
Title:    1.5px (tracking wide — 参考画像の "PLAYING NOW" スタイル)
Body:     0px
Monospace: 0px
```

---

## 5. Spacing & Layout

### Spacing Scale

```
xs:    4px
sm:    8px
md:    16px
lg:    24px
xl:    32px
xxl:   48px
```

### Border Radius

```
Full:       9999px   丸ボタン
Card:       24px     メインカード
Inner Card: 16px     カード内の要素
Input:      12px     入力フィールド
Small:      8px      小さい要素
```

### Screen Padding

```
Horizontal: 24px
Vertical:   16px (SafeArea内)
```

---

## 6. Components

### 6.1 Device Card (Home画面)

```
┌────────────────────────────────────────┐
│ ┌────────────────────────────────────┐ │  ← Raised neumorphic card
│ │                                    │ │     borderRadius: 24
│ │   🟢  esp-serial                   │ │     padding: 20
│ │       192.168.4.1:23               │ │
│ │       ESP8266 • v1.0.0             │ │  ← 🟢 = Status dot (8px circle)
│ │                                    │ │
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘

Active (selected) card:
- 左ボーダーに Accent Primary (#FF6B35) の 3px ライン
- または card 全体に subtle accent glow
```

### 6.2 Circular Action Button

参考画像の再生/一時停止ボタンのスタイル:

```
Primary Action (Accent):
  ┌─────────┐
  │         │   width/height: 64px
  │  ● icon │   borderRadius: 32px (完全円)
  │         │   backgroundColor: #FF6B35
  └─────────┘   shadow: 0 0 20px #FF6B3540 (accent glow)

Secondary Action (Neumorphic):
  ┌─────────┐
  │         │   width/height: 48px
  │  ● icon │   borderRadius: 24px (完全円)
  │         │   backgroundColor: #1E1E32
  └─────────┘   shadow: neumorphic raised
```

Serial Air での使い方:
- **Primary**: 接続ボタン、ログ保存
- **Secondary**: 一時停止、クリア、フィルター、設定

### 6.3 Log Viewer Area

```
┌──────────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │  ← Debossed container
│ ▓                                  ▓ │     borderRadius: 16
│ ▓  10:23:01  Hello from ESP!       ▓ │     backgroundColor: #16162A
│ ▓  10:23:02  Temperature: 25.3°C   ▓ │     monospace font
│ ▓  10:23:03  Humidity: 60.2%       ▓ │
│ ▓  10:23:04  [OTA] Checking...     ▓ │  ← 各行は padding: 4 8
│ ▓  10:23:05  Heap: 32456 bytes     ▓ │     タイムスタンプ: Text Muted
│ ▓                                  ▓ │     テキスト: Text Primary
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
└──────────────────────────────────────┘

ログ行ホバー/選択: backgroundColor: #252540 (Surface Light)
```

### 6.4 Connection Status Bar

```
Connected:
┌──────────────────────────────────────┐
│  ← esp-serial          🟢 Connected │  ← header with back button
└──────────────────────────────────────┘
  Text: #4ADE80 (green)
  Dot:  pulsing animation (opacity 0.5 → 1.0, 2s cycle)

Reconnecting:
┌──────────────────────────────────────┐
│  ← esp-serial     🟡 Reconnecting...│
└──────────────────────────────────────┘
  Text: #FBBF24 (yellow)
  Dot:  blinking animation (0.3s interval)

Disconnected:
┌──────────────────────────────────────┐
│  ← esp-serial       🔴 Disconnected │
└──────────────────────────────────────┘
  Text: #F87171 (red)
```

### 6.5 Manual Connection Input

```
┌────────────────────────────────────────┐
│  ┌──────────────────┐  ┌──────────┐   │
│  │  192.168.4.1     │  │  23      │   │  ← Debossed input fields
│  │  IP Address      │  │  Port    │   │     borderRadius: 12
│  └──────────────────┘  └──────────┘   │     backgroundColor: #16162A
│                                        │     text: #E8E8F0
│           ( ● Connect )                │     placeholder: #555570
│                                        │  ← Accent circular button
└────────────────────────────────────────┘
```

### 6.6 Bottom Action Bar (Monitor画面)

```
┌──────────────────────────────────────┐
│                                      │  ← Raised neumorphic bar
│   ⏸    📋    💾    🗑     Lines:42  │     固定フッター
│                                      │     各アイコン: 円形ニューモーフィックボタン
└──────────────────────────────────────┘

アイコンボタン: 40x40px, borderRadius: 20
アクティブ状態: debossed に切り替え
```

### 6.7 Filter/Search Bar

```
┌──────────────────────────────────────┐
│  🔍 │ Filter logs...            ✕   │  ← Debossed input
│     │                               │     borderRadius: 12
└──────────────────────────────────────┘
  フォーカス時: subtle accent border (#FF6B3540)
```

### 6.8 Command Input (双方向通信)

```
┌──────────────────────────────────────┐
│  │ Send command...              (➤) │  ← Debossed input + Accent send button
└──────────────────────────────────────┘
  Send button: 36x36 circle, #FF6B35
```

---

## 7. Screen Designs (Neumorphic)

### 7.1 Home Screen

```
┌──────────────────────────────────────────┐
│                                          │  bg: #1A1A2E
│   S E R I A L   A I R            (⚙️)   │  ← Title: letter-spacing 1.5px
│                                          │     ⚙️: neumorphic circle button
│   ┌──────────────────────────────────┐   │
│   │  📡  D I S C O V E R E D        │   │  ← Section header (tracking wide)
│   └──────────────────────────────────┘   │
│                                          │
│   ╭──────────────────────────────────╮   │  ← Raised card, borderRadius: 24
│   │                                  │   │     active: left accent border
│   │  🟢  esp-serial                  │   │
│   │      192.168.4.1:23 • ESP8266    │   │
│   │                                  │   │
│   ╰──────────────────────────────────╯   │
│                                          │
│   ╭──────────────────────────────────╮   │
│   │                                  │   │
│   │  🟢  living-room-sensor          │   │
│   │      192.168.1.105:23 • ESP32    │   │
│   │                                  │   │
│   ╰──────────────────────────────────╯   │
│                                          │
│   ╭──────────────────────────────────╮   │
│   │                                  │   │
│   │  🔴  garage-temp                 │   │
│   │      Last seen: 5 min ago        │   │
│   │                                  │   │
│   ╰──────────────────────────────────╯   │
│                                          │
│   ┌──────────────────────────────────┐   │
│   │  M A N U A L                     │   │
│   └──────────────────────────────────┘   │
│                                          │
│   ╭──────────────────────────────────╮   │  ← Raised card
│   │                                  │   │
│   │  ╔══════════════╗  ╔════════╗    │   │  ← Debossed inputs
│   │  ║ 192.168.4.1  ║  ║  23    ║    │   │
│   │  ║ IP Address   ║  ║  Port  ║    │   │
│   │  ╚══════════════╝  ╚════════╝    │   │
│   │                                  │   │
│   │          ( ● Connect )           │   │  ← Accent circle button
│   │                                  │   │
│   ╰──────────────────────────────────╯   │
│                                          │
│   R E C E N T                            │
│   192.168.4.1:23           2h ago        │  ← Text only, tappable
│   192.168.1.105:23         yesterday     │
│                                          │
└──────────────────────────────────────────┘
```

### 7.2 Monitor Screen

```
┌──────────────────────────────────────────┐
│                                          │  bg: #1A1A2E
│   (←)  esp-serial         🟢 Connected  │  ← ← is neumorphic circle button
│                                          │     Status dot: pulsing
│   ╭──────────────────────────────────╮   │
│   │ 🔍 │ Filter logs...          ✕  │   │  ← Debossed search bar
│   ╰──────────────────────────────────╯   │
│                                          │
│   ╔══════════════════════════════════╗   │  ← Debossed log area (main content)
│   ║                                  ║   │     flex: 1 (fills remaining space)
│   ║  10:23:01.123  Boot complete     ║   │     monospace font
│   ║  10:23:01.456  WiFi connected    ║   │     bg: #16162A
│   ║  10:23:02.001  IP: 192.168.4.1   ║   │
│   ║  10:23:05.234  Temp: 25.3°C      ║   │
│   ║  10:23:05.235  Humidity: 60.2%   ║   │
│   ║  10:23:10.567  [OTA] Checking... ║   │  ← purple color for [OTA]
│   ║  10:23:11.890  [OTA] Up to date  ║   │
│   ║  10:23:15.234  Temp: 25.4°C      ║   │
│   ║  10:23:15.235  Humidity: 60.1%   ║   │
│   ║  10:23:25.234  Temp: 25.3°C      ║   │
│   ║  10:23:25.235  Humidity: 60.3%   ║   │
│   ║  10:23:25.236  Heap: 32456 bytes ║   │
│   ║                                  ║   │
│   ║                      ▼ Auto ↓    ║   │  ← auto-scroll indicator
│   ╚══════════════════════════════════╝   │
│                                          │
│   ╭──────────────────────────────────╮   │  ← Raised bottom bar
│   │                                  │   │
│   │  (⏸)  (📋)  (💾)  (🗑)   42行  │   │  ← Neumorphic circle buttons
│   │                                  │   │     アクティブ: debossed
│   ╰──────────────────────────────────╯   │
│                                          │
│   ╭──────────────────────────────────╮   │
│   │  │ Send command...          (➤) │   │  ← Debossed input + accent send
│   ╰──────────────────────────────────╯   │
│                                          │
└──────────────────────────────────────────┘
```

### 7.3 Settings Screen

```
┌──────────────────────────────────────────┐
│                                          │  bg: #1A1A2E
│   (←)  S E T T I N G S                  │
│                                          │
│   D I S P L A Y                          │  ← Section header (tracking wide)
│                                          │
│   ╭──────────────────────────────────╮   │  ← Raised card (設定グループ)
│   │                                  │   │
│   │  Font Size              ╔════╗   │   │
│   │                         ║ 14 ║   │   │  ← Debossed value picker
│   │  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  ╚════╝   │   │     divider: #252540
│   │                                  │   │
│   │  Timestamp              (🔘 ON)  │   │  ← Neumorphic toggle
│   │  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │   │     ON: accent orange track
│   │                                  │   │     OFF: debossed dark track
│   │  Auto-scroll            (🔘 ON)  │   │
│   │  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │   │
│   │                                  │   │
│   │  Max Lines             ╔══════╗  │   │
│   │                        ║10000 ║  │   │
│   │  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ╚══════╝  │   │
│   │                                  │   │
│   │  Theme                 ╔══════╗  │   │
│   │                        ║ Dark ║  │   │  ← v1.0 は Dark 固定
│   │                        ╚══════╝  │   │
│   ╰──────────────────────────────────╯   │
│                                          │
│   C O N N E C T I O N                    │
│                                          │
│   ╭──────────────────────────────────╮   │
│   │                                  │   │
│   │  Default Port           ╔════╗   │   │
│   │                         ║ 23 ║   │   │
│   │  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  ╚════╝   │   │
│   │                                  │   │
│   │  Auto-reconnect         (🔘 ON)  │   │
│   │  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │   │
│   │                                  │   │
│   │  Reconnect Interval    ╔═════╗   │   │
│   │                        ║  5s ║   │   │
│   │  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ╚═════╝   │   │
│   │                                  │   │
│   │  Timeout               ╔═════╗   │   │
│   │                        ║ 10s ║   │   │
│   │                        ╚═════╝   │   │
│   ╰──────────────────────────────────╯   │
│                                          │
│   A B O U T                              │
│                                          │
│   ╭──────────────────────────────────╮   │
│   │  Version                 1.0.0   │   │
│   │  Arduino Library            ↗    │   │
│   │  GitHub                     ↗    │   │
│   │  Rate this app              ⭐    │   │
│   ╰──────────────────────────────────╯   │
│                                          │
└──────────────────────────────────────────┘
```

---

## 8. Animations & Interactions

### 8.1 Connection Status Dot

```
Connected (🟢):
  - Pulse animation: opacity 0.4 → 1.0 → 0.4
  - Duration: 2000ms, easing: ease-in-out
  - Infinite loop

Reconnecting (🟡):
  - Blink animation: opacity 0.0 → 1.0
  - Duration: 600ms
  - Infinite loop

Disconnected (🔴):
  - Static, no animation
```

### 8.2 Button Press

```
Neumorphic button press:
  - Transform: scale(0.95)
  - Shadow: raised → debossed (invert shadows)
  - Duration: 100ms
  - Easing: ease-out
```

### 8.3 Device Card Tap

```
  - Scale: 1.0 → 0.98 → 1.0
  - Background: Surface → Surface Light
  - Duration: 150ms
  - Navigate to Monitor screen with slide-left transition
```

### 8.4 New Log Line

```
  - FadeIn from opacity 0 → 1
  - Duration: 150ms
  - Auto-scroll: smooth (animated: true in FlatList.scrollToEnd)
```

### 8.5 Device Discovery

```
New device found:
  - Card slides in from bottom
  - FadeIn + SlideUp (translateY: 20 → 0)
  - Duration: 300ms

Device lost:
  - FadeOut + SlideDown
  - Duration: 200ms
```

---

## 9. Iconography

### Icon Style
- **Line icons** (outlined, not filled)
- **Stroke width**: 1.5px
- **Color**: Text Secondary (#8888A0) default, Text Primary (#E8E8F0) active
- **Source**: `@expo/vector-icons` (Ionicons or Feather)

### Icon Map

| 用途 | Icon | Library |
|------|------|---------|
| Back | `arrow-left` | Feather |
| Settings | `settings` | Feather |
| Search | `search` | Feather |
| Clear search | `x` | Feather |
| Pause | `pause` | Feather |
| Resume | `play` | Feather |
| Copy | `copy` | Feather |
| Save | `download` | Feather |
| Clear log | `trash-2` | Feather |
| Send | `send` | Feather |
| WiFi | `wifi` | Feather |
| Device | `cpu` | Feather |
| Connected | `check-circle` | Feather |
| Disconnected | `x-circle` | Feather |
| Auto-scroll | `chevrons-down` | Feather |
| External link | `external-link` | Feather |

---

## 10. Implementation Notes (React Native)

### 10.1 Neumorphism Library

`react-native-shadow-2` を使用してニューモーフィズムシャドウを実現:

```typescript
import { Shadow } from 'react-native-shadow-2';

// Raised card
<Shadow
  distance={6}
  startColor="#25254530"
  endColor="#00000000"
  offset={[-3, -3]}
>
  <Shadow
    distance={6}
    startColor="#12121F60"
    endColor="#00000000"
    offset={[3, 3]}
  >
    <View style={styles.card}>
      {children}
    </View>
  </Shadow>
</Shadow>
```

代替案: ネストされたShadowが重い場合、`expo-linear-gradient` + `View` で擬似的に表現。

### 10.2 Theme Constants

```typescript
// constants/theme.ts

export const colors = {
  bg: {
    primary: '#1A1A2E',
    surface: '#1E1E32',
    surfaceLight: '#252540',
    surfaceRaised: '#2A2A45',
    debossed: '#16162A',
  },
  shadow: {
    dark: '#12121F',
    light: '#252545',
  },
  text: {
    primary: '#E8E8F0',
    secondary: '#8888A0',
    muted: '#555570',
    timestamp: '#6A6A85',
  },
  accent: {
    primary: '#FF6B35',
    active: '#FF8855',
    glow: '#FF6B3540',
  },
  status: {
    connected: '#4ADE80',
    connecting: '#FBBF24',
    disconnected: '#F87171',
    offline: '#555570',
  },
  log: {
    default: '#E8E8F0',
    error: '#F87171',
    warning: '#FBBF24',
    info: '#60A5FA',
    debug: '#8888A0',
    ota: '#A78BFA',
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const borderRadius = {
  full: 9999,
  card: 24,
  innerCard: 16,
  input: 12,
  small: 8,
} as const;

export const fontSize = {
  titleLarge: 28,
  titleMedium: 22,
  titleSmall: 18,
  body: 16,
  bodySmall: 14,
  caption: 12,
  logText: 13,
  logTimestamp: 11,
} as const;
```

### 10.3 Reusable Neumorphic Components

以下のコンポーネントを `src/components/neumorphic/` に作成:

```
neumorphic/
├── NeuCard.tsx          # Raised card container
├── NeuButton.tsx        # Circular neumorphic button
├── NeuInput.tsx         # Debossed text input
├── NeuToggle.tsx        # Neumorphic toggle switch
├── NeuContainer.tsx     # Debossed container (log area)
└── index.ts             # Re-exports
```

---

## 11. App Icon

### Design Concept
- ダークニューモーフィック背景 (#1A1A2E)
- 中央にWiFiアイコン (signal waves) をオレンジ (#FF6B35) で
- ニューモーフィックの丸みを帯びたシルエット
- App Store要件: 1024x1024px, no alpha, no rounded corners (iOS が自動で丸める)

### Icon Variants
```
icon.png          1024x1024   App Store
adaptive-icon.png 1024x1024   Android (将来用)
favicon.png       48x48       Web (将来用)
```
