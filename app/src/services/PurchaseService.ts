/**
 * PurchaseService — RevenueCat integration for Serial Air.
 *
 * Handles:
 * - RevenueCat SDK initialization
 * - 7-day free trial (date-based, local)
 * - $1.99 one-time purchase (non-consumable)
 * - Purchase state persistence
 *
 * RevenueCat setup:
 * 1. Create project at https://app.revenuecat.com
 * 2. Add iOS + Android apps
 * 3. Create entitlement "pro"
 * 4. Create product "serial_air_pro" ($1.99 non-consumable)
 * 5. Set REVENUECAT_API_KEY below
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases, {
  LOG_LEVEL,
  PurchasesPackage,
  CustomerInfo,
} from 'react-native-purchases';

const TRIAL_START_KEY = 'serial-air:trial-start';
const PURCHASE_KEY = 'serial-air:purchased';
const TRIAL_DAYS = 7;

// Replace with your actual RevenueCat API keys
const REVENUECAT_API_KEY_IOS = 'appl_YOUR_REVENUECAT_IOS_KEY';
const REVENUECAT_API_KEY_ANDROID = 'goog_YOUR_REVENUECAT_ANDROID_KEY';

export const ENTITLEMENT_ID = 'pro';
export const PRODUCT_ID = 'serial_air_pro';

export interface TrialStatus {
  isTrialActive: boolean;
  isPurchased: boolean;
  trialDaysRemaining: number;
  trialStartDate: Date | null;
  hasAccess: boolean;
}

let isConfigured = false;

export class PurchaseService {
  /**
   * Configure RevenueCat SDK. Call once at app startup.
   */
  static async configure(): Promise<void> {
    if (isConfigured) return;

    const apiKey = Platform.OS === 'ios'
      ? REVENUECAT_API_KEY_IOS
      : REVENUECAT_API_KEY_ANDROID;

    // Skip configuration if placeholder keys
    if (apiKey.includes('YOUR_REVENUECAT')) {
      console.warn('[PurchaseService] Using placeholder API key — RevenueCat disabled');
      return;
    }

    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }

    await Purchases.configure({ apiKey });
    isConfigured = true;
  }

  /**
   * Initialize trial on first launch.
   */
  static async initializeTrial(): Promise<void> {
    const existing = await AsyncStorage.getItem(TRIAL_START_KEY);
    if (!existing) {
      await AsyncStorage.setItem(TRIAL_START_KEY, new Date().toISOString());
    }
  }

  /**
   * Get current trial/purchase status.
   * Checks both local trial and RevenueCat entitlements.
   */
  static async getStatus(): Promise<TrialStatus> {
    const [trialStartStr, purchasedStr] = await Promise.all([
      AsyncStorage.getItem(TRIAL_START_KEY),
      AsyncStorage.getItem(PURCHASE_KEY),
    ]);

    let isPurchased = purchasedStr === 'true';

    // Also check RevenueCat if configured
    if (!isPurchased && isConfigured) {
      try {
        const customerInfo = await Purchases.getCustomerInfo();
        isPurchased = !!customerInfo.entitlements.active[ENTITLEMENT_ID];
        if (isPurchased) {
          await AsyncStorage.setItem(PURCHASE_KEY, 'true');
        }
      } catch {
        // Fall through to local check
      }
    }

    let trialStartDate: Date | null = null;
    let trialDaysRemaining = 0;
    let isTrialActive = false;

    if (trialStartStr) {
      trialStartDate = new Date(trialStartStr);
      const elapsed = Date.now() - trialStartDate.getTime();
      const daysElapsed = elapsed / (1000 * 60 * 60 * 24);
      trialDaysRemaining = Math.max(0, Math.ceil(TRIAL_DAYS - daysElapsed));
      isTrialActive = trialDaysRemaining > 0;
    }

    return {
      isTrialActive,
      isPurchased,
      trialDaysRemaining,
      trialStartDate,
      hasAccess: isPurchased || isTrialActive,
    };
  }

  /**
   * Get the available package for purchase.
   */
  static async getPackage(): Promise<PurchasesPackage | null> {
    if (!isConfigured) return null;
    try {
      const offerings = await Purchases.getOfferings();
      return offerings.current?.availablePackages[0] ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Purchase the pro package.
   * Returns CustomerInfo on success, null on failure/cancel.
   */
  static async purchase(): Promise<CustomerInfo | null> {
    if (!isConfigured) {
      // Fallback for dev/placeholder: mark purchased locally
      await this.setPurchased();
      return null;
    }

    const pkg = await this.getPackage();
    if (!pkg) throw new Error('No package available');

    const { customerInfo } = await Purchases.purchasePackage(pkg);
    if (customerInfo.entitlements.active[ENTITLEMENT_ID]) {
      await this.setPurchased();
    }
    return customerInfo;
  }

  /**
   * Mark purchase as complete locally.
   */
  static async setPurchased(): Promise<void> {
    await AsyncStorage.setItem(PURCHASE_KEY, 'true');
  }

  /**
   * Quick access check.
   */
  static async hasAccess(): Promise<boolean> {
    const status = await this.getStatus();
    return status.hasAccess;
  }

  /**
   * Restore purchases via RevenueCat.
   */
  static async restorePurchase(): Promise<boolean> {
    if (isConfigured) {
      try {
        const customerInfo = await Purchases.restorePurchases();
        const isActive = !!customerInfo.entitlements.active[ENTITLEMENT_ID];
        if (isActive) {
          await this.setPurchased();
          return true;
        }
        return false;
      } catch {
        return false;
      }
    }

    // Fallback: check local state
    const status = await this.getStatus();
    return status.isPurchased;
  }
}
