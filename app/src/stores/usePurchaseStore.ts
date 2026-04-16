import { create } from 'zustand';
import { PurchaseService } from '../services/PurchaseService';
import { getEffectiveFreeMode } from '../constants/defaults';

interface PurchaseStore {
  isLoaded: boolean;
  isPurchased: boolean;
  isTrialActive: boolean;
  trialDaysRemaining: number;
  hasAccess: boolean;
  isPurchasing: boolean;
  isRestoring: boolean;
  error: string | null;

  loadStatus: () => Promise<void>;
  purchase: () => Promise<boolean>;
  restore: () => Promise<boolean>;
}

export const usePurchaseStore = create<PurchaseStore>((set) => ({
  isLoaded: false,
  isPurchased: getEffectiveFreeMode(), // In free mode, treat as purchased
  isTrialActive: false,
  trialDaysRemaining: 0,
  hasAccess: getEffectiveFreeMode(), // In free mode, always grant access
  isPurchasing: false,
  isRestoring: false,
  error: null,

  loadStatus: async () => {
    // In free mode, skip IAP initialization entirely
    if (getEffectiveFreeMode()) {
      set({ isLoaded: true, isPurchased: true, hasAccess: true });
      return;
    }

    try {
      await PurchaseService.initialize();
      await PurchaseService.initializeTrial();
      const status = await PurchaseService.getStatus();
      set({
        isLoaded: true,
        isPurchased: status.isPurchased,
        isTrialActive: status.isTrialActive,
        trialDaysRemaining: status.trialDaysRemaining,
        hasAccess: status.hasAccess,
      });
    } catch {
      set({ isLoaded: true });
    }
  },

  purchase: async () => {
    if (getEffectiveFreeMode()) return true;

    set({ isPurchasing: true, error: null });
    try {
      await PurchaseService.purchase();
      set({
        isPurchasing: false,
        isPurchased: true,
        hasAccess: true,
      });
      return true;
    } catch (e: any) {
      const msg = e?.userCancelled
        ? 'Purchase cancelled'
        : 'Purchase failed. Please try again.';
      set({ isPurchasing: false, error: msg });
      return false;
    }
  },

  restore: async () => {
    if (getEffectiveFreeMode()) return true;

    set({ isRestoring: true, error: null });
    try {
      const restored = await PurchaseService.restorePurchase();
      if (restored) {
        set({
          isRestoring: false,
          isPurchased: true,
          hasAccess: true,
        });
        return true;
      } else {
        set({
          isRestoring: false,
          error: 'No previous purchase found.',
        });
        return false;
      }
    } catch {
      set({
        isRestoring: false,
        error: 'Restore failed. Please try again.',
      });
      return false;
    }
  },
}));
