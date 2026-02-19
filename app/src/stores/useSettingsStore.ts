import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SettingsState } from '../types';
import { DEFAULT_SETTINGS } from '../constants/defaults';

const SETTINGS_KEY = 'serial-air:settings';

interface SettingsStore extends SettingsState {
  loadSettings: () => Promise<void>;
  updateSetting: <K extends keyof SettingsState>(
    key: K,
    value: SettingsState[K]
  ) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  ...DEFAULT_SETTINGS,

  loadSettings: async () => {
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<SettingsState>;
        set({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch {
      // Ignore load errors, use defaults
    }
  },

  updateSetting: (key, value) => {
    set({ [key]: value } as any);
    // Persist async
    const state = get();
    const toSave: SettingsState = {
      fontSize: state.fontSize,
      showTimestamp: state.showTimestamp,
      autoScroll: state.autoScroll,
      maxLines: state.maxLines,
      colorTheme: state.colorTheme,
      defaultPort: state.defaultPort,
      autoReconnect: state.autoReconnect,
      reconnectInterval: state.reconnectInterval,
      connectionTimeout: state.connectionTimeout,
      autoSave: state.autoSave,
      maxFileSize: state.maxFileSize,
    };
    AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(toSave)).catch(
      console.warn
    );
  },

  resetSettings: () => {
    set(DEFAULT_SETTINGS);
    AsyncStorage.removeItem(SETTINGS_KEY).catch(console.warn);
  },
}));
