import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { TrustedDevice, DeviceFingerprint } from '../types';

const STORAGE_KEY = 'serial-air:trusted-devices';

export interface FingerprintMismatch {
  field: string;
  expected: string;
  actual: string;
}

interface TrustStore {
  trustedDevices: TrustedDevice[];
  loadTrustedDevices: () => Promise<void>;
  trustDevice: (device: TrustedDevice) => void;
  removeTrustedDevice: (deviceId: string) => void;
  isDeviceTrusted: (deviceId: string) => boolean;
  getTrustedDevice: (deviceId: string) => TrustedDevice | undefined;
  updateFingerprint: (deviceId: string, fingerprint: DeviceFingerprint) => void;
  updatePassword: (deviceId: string, password: string) => Promise<void>;
  getPassword: (deviceId: string) => Promise<string | null>;
  checkFingerprint: (deviceId: string, fingerprint: DeviceFingerprint) => FingerprintMismatch[];
}

function persist(devices: TrustedDevice[]) {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(devices)).catch(console.warn);
}

export const useTrustStore = create<TrustStore>((set, get) => ({
  trustedDevices: [],

  loadTrustedDevices: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as TrustedDevice[];
        set({ trustedDevices: parsed });
      }
    } catch {
      // Ignore load errors
    }
  },

  trustDevice: (device: TrustedDevice) => {
    const { trustedDevices } = get();
    const existing = trustedDevices.findIndex((d) => d.deviceId === device.deviceId);
    let updated: TrustedDevice[];
    if (existing >= 0) {
      updated = [...trustedDevices];
      updated[existing] = { ...device, lastSeen: new Date() };
    } else {
      updated = [...trustedDevices, device];
    }
    set({ trustedDevices: updated });
    persist(updated);
  },

  removeTrustedDevice: (deviceId: string) => {
    const { trustedDevices } = get();
    const updated = trustedDevices.filter((d) => d.deviceId !== deviceId);
    set({ trustedDevices: updated });
    persist(updated);
  },

  isDeviceTrusted: (deviceId: string) => {
    return get().trustedDevices.some((d) => d.deviceId === deviceId);
  },

  getTrustedDevice: (deviceId: string) => {
    return get().trustedDevices.find((d) => d.deviceId === deviceId);
  },

  updateFingerprint: (deviceId: string, fingerprint: DeviceFingerprint) => {
    const { trustedDevices } = get();
    const updated = trustedDevices.map((d) =>
      d.deviceId === deviceId ? { ...d, fingerprint, lastSeen: new Date() } : d
    );
    set({ trustedDevices: updated });
    persist(updated);
  },

  updatePassword: async (deviceId: string, password: string) => {
    // Store password in iOS Keychain via SecureStore (not AsyncStorage)
    try {
      await SecureStore.setItemAsync(`serial-air:pass:${deviceId}`, password);
    } catch {
      // Fallback: store in memory only (won't persist across restarts)
      console.warn('[TrustStore] SecureStore unavailable, password not persisted');
    }
  },

  getPassword: async (deviceId: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(`serial-air:pass:${deviceId}`);
    } catch {
      return null;
    }
  },

  checkFingerprint: (deviceId: string, fingerprint: DeviceFingerprint): FingerprintMismatch[] => {
    const device = get().trustedDevices.find((d) => d.deviceId === deviceId);
    if (!device?.fingerprint) return [];

    const mismatches: FingerprintMismatch[] = [];
    const old = device.fingerprint;

    if (old.libraryVersion && fingerprint.libraryVersion && old.libraryVersion !== fingerprint.libraryVersion) {
      mismatches.push({ field: 'Version', expected: old.libraryVersion, actual: fingerprint.libraryVersion });
    }
    if (old.deviceType && fingerprint.deviceType && old.deviceType !== fingerprint.deviceType) {
      mismatches.push({ field: 'Device Type', expected: old.deviceType, actual: fingerprint.deviceType });
    }
    if (old.heapSize && fingerprint.heapSize) {
      const diff = Math.abs(old.heapSize - fingerprint.heapSize) / old.heapSize;
      if (diff > 0.3) { // >30% heap difference is suspicious
        mismatches.push({ field: 'Heap Size', expected: `${old.heapSize}`, actual: `${fingerprint.heapSize}` });
      }
    }

    return mismatches;
  },
}));
