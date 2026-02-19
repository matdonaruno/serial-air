/**
 * PurchaseService — RevenueCat integration for Serial Air.
 *
 * Handles:
 * - 7-day free trial (date-based, no App Store trial)
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

import AsyncStorage from '@react-native-async-storage/async-storage';

const TRIAL_START_KEY = 'serial-air:trial-start';
const PURCHASE_KEY = 'serial-air:purchased';
const TRIAL_DAYS = 7;

// Replace with your actual RevenueCat API key
export const REVENUECAT_API_KEY_IOS = 'appl_YOUR_REVENUECAT_IOS_KEY';
export const REVENUECAT_API_KEY_ANDROID = 'goog_YOUR_REVENUECAT_ANDROID_KEY';

export const ENTITLEMENT_ID = 'pro';
export const PRODUCT_ID = 'serial_air_pro';

export interface TrialStatus {
  isTrialActive: boolean;
  isPurchased: boolean;
  trialDaysRemaining: number;
  trialStartDate: Date | null;
  hasAccess: boolean; // true if trial active OR purchased
}

export class PurchaseService {
  /**
   * Initialize trial on first launch. Called once during app startup.
   */
  static async initializeTrial(): Promise<void> {
    const existing = await AsyncStorage.getItem(TRIAL_START_KEY);
    if (!existing) {
      await AsyncStorage.setItem(TRIAL_START_KEY, new Date().toISOString());
    }
  }

  /**
   * Get current trial/purchase status.
   */
  static async getStatus(): Promise<TrialStatus> {
    const [trialStartStr, purchasedStr] = await Promise.all([
      AsyncStorage.getItem(TRIAL_START_KEY),
      AsyncStorage.getItem(PURCHASE_KEY),
    ]);

    const isPurchased = purchasedStr === 'true';
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
   * Mark purchase as complete. Called after RevenueCat confirms purchase.
   */
  static async setPurchased(): Promise<void> {
    await AsyncStorage.setItem(PURCHASE_KEY, 'true');
  }

  /**
   * Check if user has access (trial or purchased).
   * Quick check for use in guards.
   */
  static async hasAccess(): Promise<boolean> {
    const status = await this.getStatus();
    return status.hasAccess;
  }

  /**
   * Restore purchases. Call after RevenueCat restorePurchases().
   * If entitlement is active, mark as purchased locally.
   */
  static async restorePurchase(): Promise<boolean> {
    // In real implementation, this calls RevenueCat:
    //
    // try {
    //   const customerInfo = await Purchases.restorePurchases();
    //   const isActive = customerInfo.entitlements.active[ENTITLEMENT_ID];
    //   if (isActive) {
    //     await this.setPurchased();
    //     return true;
    //   }
    //   return false;
    // } catch {
    //   return false;
    // }

    // For now, check local state
    const status = await this.getStatus();
    return status.isPurchased;
  }
}
