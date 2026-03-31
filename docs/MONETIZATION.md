# Serial Air — Monetization Guide

## Current State (v1.0): FREE_MODE = true

All features are free. No trial, no paywall, no IAP prompts.
The IAP code is fully implemented but dormant.

## How It Works

A single flag controls the entire monetization system:

```
app/src/constants/defaults.ts → FREE_MODE = true | false
```

| FREE_MODE | Behavior |
|-----------|----------|
| `true`  | All features unlocked, no trial timer, no paywall, PURCHASE section hidden in Settings |
| `false` | 7-day free trial → $1.99 one-time purchase (non-consumable IAP) |

## Files Involved

| File | Role |
|------|------|
| `app/src/constants/defaults.ts` | `FREE_MODE` flag definition |
| `app/src/stores/usePurchaseStore.ts` | Checks `FREE_MODE`, skips IAP init when true |
| `app/src/services/PurchaseService.ts` | IAP logic (StoreKit/Google Play via react-native-iap) |
| `app/app/(tabs)/index.tsx` | Trial banner hidden when `FREE_MODE` |
| `app/app/(tabs)/settings.tsx` | PURCHASE section hidden when `FREE_MODE` |
| `app/app/paywall.tsx` | Paywall screen (unreachable in `FREE_MODE` but code remains) |

## Migration: Free → Paid (v1.x Update)

### Prerequisites

1. **App Store Connect**: Create non-consumable IAP product
   - Product ID: `serial_air_pro`
   - Price: $1.99 (or localized equivalent)
   - Review information and screenshot prepared

2. **Google Play Console** (if Android):
   - Create one-time product `serial_air_pro`

### Steps

1. **Change the flag**:
   ```typescript
   // app/src/constants/defaults.ts
   export const FREE_MODE = false;  // ← Change from true to false
   ```

2. **Verify IAP product exists** in App Store Connect with ID `serial_air_pro`

3. **Test on TestFlight**:
   - Fresh install → should see 7-day trial
   - Trial expiry → paywall appears
   - Purchase flow → completes successfully
   - Restore purchase → works

4. **Submit update** with release notes explaining the new Pro tier

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
