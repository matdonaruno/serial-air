import { create } from 'zustand';
import { Device, RecentConnection } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RECENT_CONNECTIONS_KEY = 'serial-air:recent-connections';
const MAX_RECENT = 10;

interface DiscoveryStore {
  devices: Device[];
  isScanning: boolean;
  recentConnections: RecentConnection[];

  setScanning: (scanning: boolean) => void;
  addDevice: (device: Device) => void;
  removeDevice: (name: string) => void;
  clearDevices: () => void;
  addRecentConnection: (connection: RecentConnection) => void;
  loadRecentConnections: () => Promise<void>;
}

export const useDiscoveryStore = create<DiscoveryStore>((set, get) => ({
  devices: [],
  isScanning: false,
  recentConnections: [],

  setScanning: (scanning: boolean) => {
    set({ isScanning: scanning });
  },

  addDevice: (device: Device) => {
    set((state) => {
      const existing = state.devices.findIndex((d) => d.name === device.name);
      if (existing >= 0) {
        const updated = [...state.devices];
        updated[existing] = { ...device, isOnline: true, lastSeen: new Date() };
        return { devices: updated };
      }
      return { devices: [...state.devices, device] };
    });
  },

  removeDevice: (name: string) => {
    set((state) => ({
      devices: state.devices.map((d) =>
        d.name === name ? { ...d, isOnline: false, lastSeen: new Date() } : d
      ),
    }));
  },

  clearDevices: () => {
    set({ devices: [] });
  },

  addRecentConnection: (connection: RecentConnection) => {
    set((state) => {
      const filtered = state.recentConnections.filter(
        (c) => !(c.host === connection.host && c.port === connection.port)
      );
      const updated = [connection, ...filtered].slice(0, MAX_RECENT);
      // Persist async
      AsyncStorage.setItem(
        RECENT_CONNECTIONS_KEY,
        JSON.stringify(updated)
      ).catch(console.warn);
      return { recentConnections: updated };
    });
  },

  loadRecentConnections: async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_CONNECTIONS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as RecentConnection[];
        set({
          recentConnections: parsed.map((c) => ({
            ...c,
            lastConnected: new Date(c.lastConnected),
          })),
        });
      }
    } catch {
      // Ignore load errors
    }
  },
}));
