import { SettingsState } from '../types';

export const DEFAULT_PORT = 23;
export const MDNS_SERVICE_TYPE = '_serial-air._tcp.';
export const MAX_LOG_LINES = 10000;
export const RECONNECT_INTERVAL_MS = 5000;
export const CONNECTION_TIMEOUT_MS = 10000;

export const DEFAULT_SETTINGS: SettingsState = {
  fontSize: 14,
  showTimestamp: true,
  autoScroll: true,
  maxLines: MAX_LOG_LINES,
  colorTheme: 'dark',
  defaultPort: DEFAULT_PORT,
  autoReconnect: true,
  reconnectInterval: RECONNECT_INTERVAL_MS,
  connectionTimeout: CONNECTION_TIMEOUT_MS,
  autoSave: false,
  maxFileSize: 10 * 1024 * 1024, // 10MB
};

export const COLORS = {
  dark: {
    background: '#1a1a2e',
    surface: '#16213e',
    surfaceVariant: '#0f3460',
    primary: '#00d2ff',
    primaryVariant: '#0095b6',
    text: '#e0e0e0',
    textSecondary: '#8899a6',
    textMuted: '#556677',
    success: '#4caf50',
    error: '#f44336',
    warning: '#ff9800',
    border: '#2a3a5c',
    logBackground: '#0d1117',
    logText: '#c9d1d9',
    timestamp: '#7c8a99',
  },
  light: {
    background: '#f5f5f5',
    surface: '#ffffff',
    surfaceVariant: '#e8edf2',
    primary: '#0077b6',
    primaryVariant: '#005a8d',
    text: '#1a1a1a',
    textSecondary: '#666666',
    textMuted: '#999999',
    success: '#2e7d32',
    error: '#d32f2f',
    warning: '#ed6c02',
    border: '#e0e0e0',
    logBackground: '#fafafa',
    logText: '#24292f',
    timestamp: '#6a737d',
  },
} as const;
