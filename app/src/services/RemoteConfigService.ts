import AsyncStorage from '@react-native-async-storage/async-storage';

const CONFIG_URL = 'https://umemasait.com/serial-air/config.json';
const CACHE_KEY = 'serial-air:remote-config';
const FETCH_TIMEOUT_MS = 5000;

export interface RemoteConfig {
  minVersion: string;
  freeMode: boolean;
  message: string | null;
}

const DEFAULTS: RemoteConfig = {
  minVersion: '0.0.0',
  freeMode: true,
  message: null,
};

export async function fetchRemoteConfig(): Promise<RemoteConfig> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const res = await fetch(CONFIG_URL, {
      signal: controller.signal,
      cache: 'no-cache',
    });
    clearTimeout(timer);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();
    const config: RemoteConfig = {
      minVersion: typeof json.minVersion === 'string' ? json.minVersion : DEFAULTS.minVersion,
      freeMode: typeof json.freeMode === 'boolean' ? json.freeMode : DEFAULTS.freeMode,
      message: typeof json.message === 'string' ? json.message : null,
    };

    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(config));
    return config;
  } catch {
    // Network failure — try cached config
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) return JSON.parse(cached) as RemoteConfig;
    } catch {}
    return DEFAULTS;
  }
}

export function isUpdateRequired(currentVersion: string, minVersion: string): boolean {
  const current = currentVersion.split('.').map(Number);
  const minimum = minVersion.split('.').map(Number);

  for (let i = 0; i < Math.max(current.length, minimum.length); i++) {
    const c = current[i] ?? 0;
    const m = minimum[i] ?? 0;
    if (c < m) return true;
    if (c > m) return false;
  }
  return false; // equal = not required
}
