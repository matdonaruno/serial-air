# Serial Air — Monetization Guide

## Current State (v1.0): FREE_MODE = true

All features are free. No trial, no paywall, no IAP prompts.
The IAP code is fully implemented but dormant.

## How It Works

Two layers control the monetization system:

### 1. Compile-time flag (local)
```
app/src/constants/defaults.ts → FREE_MODE = true | false
```

### 2. Remote config (server override)
```
https://umemasait.com/serial-air/config.json
```

The remote `freeMode` field overrides the local `FREE_MODE` flag at runtime.
Use `getEffectiveFreeMode()` to get the active value.

| Effective freeMode | Behavior |
|--------------------|----------|
| `true`  | All features unlocked, no trial timer, no paywall |
| `false` | 7-day free trial → $1.99 one-time purchase (non-consumable IAP) |

### Remote Config (config.json)

```json
{
  "minVersion": "1.0.0",
  "freeMode": true,
  "message": null,
  "updatedAt": "2026-04-17T00:00:00Z"
}
```

| Field | Purpose |
|-------|---------|
| `minVersion` | Minimum app version required. If user's version < this, force update screen blocks the app |
| `freeMode` | Remote override of FREE_MODE. Set to `false` to enable monetization without app update |
| `message` | Optional message shown on the force update screen |

**Hosted at**: `docs/config.json` → deployed to `umemasait.com/serial-air/config.json`

### Forced Update Flow

```
App Launch → fetch config.json (5s timeout)
  ├─ Network OK → cache config, compare versions
  │   ├─ app version < minVersion → ForceUpdateScreen (blocking, links to App Store)
  │   └─ app version >= minVersion → continue normally
  ├─ Network fail → use cached config (AsyncStorage)
  └─ No cache → use defaults (freeMode=true, no force update)
```

## Files Involved

| File | Role |
|------|------|
| `docs/config.json` | Remote config (deployed to website) |
| `app/src/services/RemoteConfigService.ts` | Fetch, cache, version compare |
| `app/src/components/ForceUpdateScreen.tsx` | Blocking update screen |
| `app/src/constants/defaults.ts` | `FREE_MODE` flag + `getEffectiveFreeMode()` |
| `app/src/stores/useAppStore.ts` | Remote config state + `loadRemoteConfig()` |
| `app/src/stores/usePurchaseStore.ts` | Checks `getEffectiveFreeMode()`, skips IAP init when true |
| `app/src/services/PurchaseService.ts` | IAP logic (StoreKit/Google Play via react-native-iap) |
| `app/app/_layout.tsx` | Startup: load remote config → check version → render ForceUpdateScreen |
| `app/app/(tabs)/index.tsx` | Trial banner hidden when `getEffectiveFreeMode()` |
| `app/app/(tabs)/settings.tsx` | PURCHASE section hidden when `getEffectiveFreeMode()` |
| `app/app/paywall.tsx` | Paywall screen (unreachable in free mode but code remains) |

## Migration: Free → Paid (v1.x Update)

### Prerequisites

1. **App Store Connect**: Create non-consumable IAP product
   - Product ID: `serial_air_pro`
   - Price: $1.99 (or localized equivalent)
   - Review information and screenshot prepared

2. **Google Play Console** (if Android):
   - Create one-time product `serial_air_pro`

### Steps

**Option A: Remote switch (no app update needed)**

1. Edit `docs/config.json`:
   ```json
   { "minVersion": "1.1.0", "freeMode": false, "message": null }
   ```
2. Deploy to `umemasait.com/serial-air/config.json`
3. Set `minVersion` to the version that has IAP properly configured
4. All users on that version will see the trial/paywall on next launch

**Option B: Local flag change (requires app update)**

1. Change `FREE_MODE = false` in `defaults.ts`
2. Submit app update
3. Optionally set `minVersion` in config.json to force users to update

**Recommended approach**: Combine both. Release an app update with IAP product configured, then flip `freeMode` to `false` remotely once the update is widely adopted. Set `minVersion` to the new version to force stragglers to update.

### Testing

1. **Verify IAP product exists** in App Store Connect with ID `serial_air_pro`
2. **Test on TestFlight**:
   - Fresh install → should see 7-day trial
   - Trial expiry → paywall appears
   - Purchase flow → completes successfully
   - Restore purchase → works
3. **Test forced update**: Set `minVersion` to `99.0.0` in config.json temporarily → app shows ForceUpdateScreen
4. **Test remote freeMode**: Set `freeMode: false` in config.json → monetization activates without app update

### What Happens to Existing Users

- Existing users who installed during FREE_MODE will see the trial start on their **next app launch** after the update
- The trial timer starts from `PurchaseService.initializeTrial()` — the first time the function runs with `FREE_MODE = false`
- Users who already had the app get 7 days from the update, not from original install

### If You Want to Grandfather Existing Users

To give free-forever access to users who installed during v1.0:

```typescript
// In PurchaseService.initializeTrial(), add before setting trial start:
const existingUser = await AsyncStorage.getItem('serial-air:installed-version');
if (existingUser && existingUser === '1.0.0') {
  // Grandfather: mark as purchased
  await AsyncStorage.setItem(PURCHASE_KEY, 'true');
  return;
}
// Track install version for future reference
await AsyncStorage.setItem('serial-air:installed-version', APP_VERSION);
```

## IAP Architecture

```
usePurchaseStore (Zustand)
  ├── loadStatus()  → PurchaseService.getStatus()
  ├── purchase()    → PurchaseService.purchase() → IAP.requestPurchase()
  └── restore()     → PurchaseService.restorePurchase() → IAP.getAvailablePurchases()

PurchaseService
  ├── initialize()        → IAP.initConnection()
  ├── initializeTrial()   → AsyncStorage (trial start date)
  ├── getStatus()         → Checks trial + purchase state
  ├── purchase()          → StoreKit transaction
  ├── restorePurchase()   → Checks App Store receipts
  └── getProducts()       → Fetches localized price ($1.99)
```

## AsyncStorage Keys

| Key | Purpose |
|-----|---------|
| `serial-air:trial-start` | ISO date when trial began |
| `serial-air:purchased` | `"true"` if purchased |
| `serial-air:remote-config` | Cached remote config JSON (fallback when offline) |

## Paywall UI

Located at `app/app/paywall.tsx`:
- Shows localized price from StoreKit (not hardcoded)
- Features list with icons
- Trial countdown badge
- Purchase button + Restore Purchase
- Terms / Privacy links
- Accessible from Settings (when `FREE_MODE = false`)

## Security Notes

- `__DEV__` guard on purchase fallback — production builds always require real StoreKit
- Purchase state stored in AsyncStorage AND verified against App Store receipts
- No server-side validation (appropriate for one-time purchase, not subscriptions)

## Testing IAP

### Simulator
- IAP initialization will timeout (expected)
- `__DEV__` fallback allows testing the flow

### TestFlight / Sandbox
- Use sandbox Apple ID
- Product must be "Ready to Submit" or "Approved" in App Store Connect
- `IAP.clearTransactionIOS()` is called on init to clean stale transactions

### Production
- Ensure `serial_air_pro` is live in App Store Connect
- Price displays via `localizedPrice` from StoreKit
