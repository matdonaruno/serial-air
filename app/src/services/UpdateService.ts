import * as Updates from 'expo-updates';
import { useAppStore } from '../stores/useAppStore';

/**
 * Check for OTA updates via expo-updates.
 * In production, this checks Expo's update server.
 * In development, this is a no-op.
 */
export async function checkForUpdates(): Promise<{
  available: boolean;
  manifest?: any;
}> {
  if (__DEV__) {
    return { available: false };
  }

  try {
    const update = await Updates.checkForUpdateAsync();
    if (update.isAvailable) {
      return { available: true, manifest: update.manifest };
    }
    return { available: false };
  } catch {
    return { available: false };
  }
}

/**
 * Fetch and apply an OTA update. Reloads the app after downloading.
 */
export async function fetchAndApplyUpdate(): Promise<boolean> {
  if (__DEV__) return false;

  try {
    const result = await Updates.fetchUpdateAsync();
    if (result.isNew) {
      await Updates.reloadAsync();
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Get the current running version info.
 */
export function getVersionInfo() {
  return {
    appVersion: useAppStore.getState().appVersion,
    updateId: Updates.updateId ?? 'dev',
    channel: Updates.channel ?? 'default',
    createdAt: Updates.createdAt?.toISOString() ?? null,
    isEmbeddedLaunch: Updates.isEmbeddedLaunch,
  };
}
