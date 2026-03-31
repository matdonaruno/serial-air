import { create } from 'zustand';
import { LogLine } from '../types';
import { MAX_LOG_LINES } from '../constants/defaults';
import { useSettingsStore } from './useSettingsStore';

interface LogStore {
  lines: LogLine[];
  isPaused: boolean;
  filter: string;
  lineCounter: number;

  addLine: (text: string) => void;
  clear: () => void;
  togglePause: () => void;
  setFilter: (filter: string) => void;
  getFilteredLines: () => LogLine[];
}

export const useLogStore = create<LogStore>((set, get) => ({
  lines: [],
  isPaused: false,
  filter: '',
  lineCounter: 0,

  addLine: (text: string) => {
    const { isPaused, lineCounter } = get();
    if (isPaused) return;

    const maxLines = useSettingsStore.getState().maxLines;
    const newId = lineCounter + 1;

    const newLine: LogLine = {
      id: newId,
      timestamp: new Date(),
      text: text.trimEnd(),
      raw: text,
    };

    set((state) => {
      const newLines = [...state.lines, newLine];
      // Trim to max lines
      if (newLines.length > maxLines) {
        return {
          lines: newLines.slice(newLines.length - maxLines),
          lineCounter: newId,
        };
      }
      return { lines: newLines, lineCounter: newId };
    });
  },

  clear: () => {
    set({ lines: [], lineCounter: 0 });
  },

  togglePause: () => {
    set((state) => ({ isPaused: !state.isPaused }));
  },

  setFilter: (filter: string) => {
    set({ filter });
  },

  getFilteredLines: () => {
    const { lines, filter } = get();
    if (!filter) return lines;
    const lowerFilter = filter.toLowerCase();
    return lines.filter((line) =>
      line.text.toLowerCase().includes(lowerFilter)
    );
  },
}));
