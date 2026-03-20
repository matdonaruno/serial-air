import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'serial-air:macros';

export interface Macro {
  id: string;
  name: string;
  command: string;
}

interface MacroStore {
  macros: Macro[];
  loadMacros: () => Promise<void>;
  addMacro: (name: string, command: string) => void;
  removeMacro: (id: string) => void;
  reorderMacros: (macros: Macro[]) => void;
}

function persist(macros: Macro[]) {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(macros)).catch(console.warn);
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export const useMacroStore = create<MacroStore>((set, get) => ({
  macros: [],

  loadMacros: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        set({ macros: JSON.parse(stored) });
      }
    } catch {
      // ignore
    }
  },

  addMacro: (name: string, command: string) => {
    const { macros } = get();
    const updated = [...macros, { id: genId(), name, command }];
    set({ macros: updated });
    persist(updated);
  },

  removeMacro: (id: string) => {
    const { macros } = get();
    const updated = macros.filter((m) => m.id !== id);
    set({ macros: updated });
    persist(updated);
  },

  reorderMacros: (macros: Macro[]) => {
    set({ macros });
    persist(macros);
  },
}));
