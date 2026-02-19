/**
 * PurchaseService — StoreKit/Google Play integration via react-native-iap.
 *
 * Handles:
 * - 7-day free trial (date-based, local)
 * - $1.99 one-time purchase (non-consumable)
 * - Purchase state persistence
 * - Restore purchases
 *
 * App Store / Google Play setup:
 * 1. Create non-consumable product "serial_air_pro" ($1.99)
 * 2. Product ID must match PRODUCT_ID below
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as IAP from 'react-native-iap';

const TRIAL_START_KEY = 'serial-air:trial-start';
const PURCHASE_KEY = 'serial-air:purchased';
const TRIAL_DAYS = 7;

export const PRODUCT_ID = 'serial_air_pro';

const productIds = [PRODUCT_ID];

export interface TrialStatus {
  isTrialActive: boolean;
  isPurchased: boolean;
  trialDaysRemaining: number;
  trialStartDate: Date | null;
  hasAccess: boolean;
}

let isInitialized = false;

export class PurchaseService {
  /**
   * Initialize IAP connection. Call once at app startup.
   */
  static async initialize(): Promise<void> {
    if (isInitialized) return;

    try {
      await IAP.initConnection();
      isInitialized = true;

      if (Platform.OS === 'ios') {
        await IAP.clearTransactionIOS();
      }
    } catch (e) {
      console.warn('[PurchaseService] IAP init failed:', e);
    }
  }

  /**
   * End IAP connection. Call on app shutdown.
   */
  static async endConnection(): Promise<void> {
    if (!isInitialized) return;
    await IAP.endConnection();
    isInitialized = false;
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
   */
  static async getStatus(): Promise<TrialStatus> {
    const [trialStartStr, purchasedStr] = await Promise.all([
      AsyncStorage.getItem(TRIAL_START_KEY),
      AsyncStorage.getItem(PURCHASE_KEY),
    ]);

    let isPurchased = purchasedStr === 'true';

    // Check store receipts if not purchased locally
    if (!isPurchased && isInitialized) {
      try {
        const purchases = await IAP.getAvailablePurchases();
        isPurchased = purchases.some((p) => p.productId === PRODUCT_ID);
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
   * Get products from the store.
   */
  static async getProducts(): Promise<IAP.Product[]> {
    if (!isInitialized) return [];
    try {
      return await IAP.getProducts({ skus: productIds });
    } catch {
      return [];
    }
  }

  /**
   * Purchase the pro product.
   * Returns true on success, false on failure/cancel.
   */
  static async purchase(): Promise<boolean> {
    if (!isInitialized) {
      // Dev fallback: mark purchased locally
      await this.setPurchased();
      return true;
    }

    try {
      await IAP.requestPurchase({ sku: PRODUCT_ID });
      await this.setPurchased();
      return true;
    } catch (e: any) {
      if (e?.code === 'E_USER_CANCELLED') {
        throw { userCancelled: true };
      }
      throw e;
    }
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
   * Restore purchases from App Store / Google Play.
   */
  static async restorePurchase(): Promise<boolean> {
    if (!isInitialized) {
      const status = await this.getStatus();
      return status.isPurchased;
    }

    try {
      const purchases = await IAP.getAvailablePurchases();
      const found = purchases.some((p) => p.productId === PRODUCT_ID);
      if (found) {
        await this.setPurchased();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}
