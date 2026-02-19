import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const APP_STATE_KEY = 'serial-air:app-state';
const LAUNCH_COUNT_KEY = 'serial-air:launch-count';

interface AppState {
  hasOnboarded: boolean;
  appVersion: string;
  launchCount: number;
  lastReviewPrompt: string | null;
  lastUpdateCheck: string | null;
  updateAvailable: boolean;
  updateVersion: string | null;

  loadState: () => Promise<void>;
  completeOnboarding: () => void;
  incrementLaunchCount: () => void;
  setReviewPrompted: () => void;
  shouldPromptReview: () => boolean;
  setUpdateAvailable: (version: string) => void;
  clearUpdate: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  hasOnboarded: false,
  appVersion: Constants.expoConfig?.version || '1.0.0',
  launchCount: 0,
  lastReviewPrompt: null,
  lastUpdateCheck: null,
  updateAvailable: false,
  updateVersion: null,

  loadState: async () => {
    try {
      const stored = await AsyncStorage.getItem(APP_STATE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        set({
          hasOnboarded: parsed.hasOnboarded ?? false,
          lastReviewPrompt: parsed.lastReviewPrompt ?? null,
          lastUpdateCheck: parsed.lastUpdateCheck ?? null,
        });
      }
      const countStr = await AsyncStorage.getItem(LAUNCH_COUNT_KEY);
      const count = countStr ? parseInt(countStr, 10) + 1 : 1;
      set({ launchCount: count });
      await AsyncStorage.setItem(LAUNCH_COUNT_KEY, String(count));
    } catch {
      // Ignore
    }
  },

  completeOnboarding: () => {
    set({ hasOnboarded: true });
    _persist(get());
  },

  incrementLaunchCount: () => {
    set((s) => ({ launchCount: s.launchCount + 1 }));
  },

  setReviewPrompted: () => {
    const now = new Date().toISOString();
    set({ lastReviewPrompt: now });
    _persist(get());
  },

  shouldPromptReview: () => {
    const { launchCount, lastReviewPrompt } = get();
    // Prompt after 5 launches, then once every 30 days
    if (launchCount < 5) return false;
    if (!lastReviewPrompt) return true;
    const daysSince =
      (Date.now() - new Date(lastReviewPrompt).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince > 30;
  },

  setUpdateAvailable: (version: string) => {
    set({ updateAvailable: true, updateVersion: version });
  },

  clearUpdate: () => {
    set({ updateAvailable: false, updateVersion: null });
  },
}));

function _persist(state: AppState) {
  const toSave = {
    hasOnboarded: state.hasOnboarded,
    lastReviewPrompt: state.lastReviewPrompt,
    lastUpdateCheck: state.lastUpdateCheck,
  };
  AsyncStorage.setItem(APP_STATE_KEY, JSON.stringify(toSave)).catch(() => {});
}
