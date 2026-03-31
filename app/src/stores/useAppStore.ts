import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const APP_STATE_KEY = 'serial-air:app-state';
const LAUNCH_COUNT_KEY = 'serial-air:launch-count';

interface AppState {
  hasOnboarded: boolean;
  appVersion: string;
  launchCount: number;
  connectionCount: number;
  lastReviewPrompt: string | null;
  lastUpdateCheck: string | null;
  updateAvailable: boolean;
  updateVersion: string | null;

  loadState: () => Promise<void>;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  incrementLaunchCount: () => void;
  incrementConnectionCount: () => void;
  setReviewPrompted: () => void;
  shouldPromptReview: () => boolean;
  setUpdateAvailable: (version: string) => void;
  clearUpdate: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  hasOnboarded: false,
  appVersion: Constants.expoConfig?.version || '1.0.0',
  launchCount: 0,
  connectionCount: 0,
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
          connectionCount: parsed.connectionCount ?? 0,
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

  resetOnboarding: () => {
    set({ hasOnboarded: false });
    _persist(get());
  },

  incrementLaunchCount: () => {
    set((s) => ({ launchCount: s.launchCount + 1 }));
  },

  incrementConnectionCount: () => {
    set((s) => {
      const newCount = s.connectionCount + 1;
      // Persist connection count
      _persist({ ...get(), connectionCount: newCount });
      return { connectionCount: newCount };
    });
  },

  setReviewPrompted: () => {
    const now = new Date().toISOString();
    set({ lastReviewPrompt: now });
    _persist(get());
  },

  shouldPromptReview: () => {
    const { connectionCount, launchCount, lastReviewPrompt } = get();
    // Prompt after 3 successful connections AND 3 launches, then once every 60 days
    if (connectionCount < 3 || launchCount < 3) return false;
    if (!lastReviewPrompt) return true;
    const daysSince =
      (Date.now() - new Date(lastReviewPrompt).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince > 60;
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
    connectionCount: state.connectionCount,
    lastReviewPrompt: state.lastReviewPrompt,
    lastUpdateCheck: state.lastUpdateCheck,
  };
  AsyncStorage.setItem(APP_STATE_KEY, JSON.stringify(toSave)).catch(() => {});
}
