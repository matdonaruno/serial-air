import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TrustedDevice } from '../types';

const STORAGE_KEY = 'serial-air:trusted-devices';

interface TrustStore {
  trustedDevices: TrustedDevice[];
  loadTrustedDevices: () => Promise<void>;
  trustDevice: (device: TrustedDevice) => void;
  removeTrustedDevice: (deviceId: string) => void;
  isDeviceTrusted: (deviceId: string) => boolean;
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
}));
