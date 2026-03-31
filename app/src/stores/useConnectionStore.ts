import { create } from 'zustand';
import { BleManager } from 'react-native-ble-plx';
import { ConnectionStatus, Device } from '../types';
import { Connection } from '../services/Connection';
import { TcpConnection } from '../services/TcpConnection';
import { BleConnection } from '../services/BleConnection';
import { useLogStore } from './useLogStore';
import { useSettingsStore } from './useSettingsStore';
import { useAppStore } from './useAppStore';
import { maybeRequestReview } from '../services/ReviewService';

// Shared BleManager singleton — may fail on simulator or devices without BLE
let _bleManager: BleManager | null = null;
export function getBleManager(): BleManager | null {
  if (!_bleManager) {
    try {
      _bleManager = new BleManager();
    } catch (e) {
      console.warn('[BLE] BleManager init failed (expected on simulator):', e);
      return null;
    }
  }
  return _bleManager;
}

interface ConnectionStore {
  status: ConnectionStatus;
  currentDevice: Device | null;
  error: string | null;
  connection: Connection | null;
  connectionType: 'wifi' | 'ble' | null;
  connectedAt: Date | null;

  connect: (host: string, port: number, deviceName?: string) => void;
  connectBLE: (bleDeviceId: string, deviceName?: string) => void;
  disconnect: () => void;
  sendCommand: (command: string) => void;
}

export const useConnectionStore = create<ConnectionStore>((set, get) => ({
  status: 'disconnected',
  currentDevice: null,
  error: null,
  connection: null,
  connectionType: null,
  connectedAt: null,

  connect: (host: string, port: number, deviceName?: string) => {
    const { connection: existingConnection } = get();
    if (existingConnection) {
      existingConnection.disconnect();
    }

    const settings = useSettingsStore.getState();

    set({
      status: 'connecting',
      error: null,
      connectionType: 'wifi',
      connectedAt: null,
      currentDevice: {
        name: deviceName || `${host}:${port}`,
        host,
        port,
        connectionType: 'wifi',
        isOnline: true,
        lastSeen: new Date(),
      },
    });

    const connection = new TcpConnection(
      {
        host,
        port,
        timeout: settings.connectionTimeout,
        reconnect: settings.autoReconnect,
        reconnectInterval: settings.reconnectInterval,
      },
      {
        onConnect: () => {
          set({ status: 'connected', error: null, connectedAt: new Date() });
          useAppStore.getState().incrementConnectionCount();
          // Delay review request to not interrupt the user immediately
          setTimeout(() => maybeRequestReview(), 5000);
        },
        onData: (data: string) => {
          useLogStore.getState().addLine(data);
        },
        onError: (error: Error) => {
          set({ error: error.message });
        },
        onClose: () => {
          const state = get();
          if (state.status !== 'disconnected') {
            set({ status: 'disconnected', connectedAt: null });
          }
        },
        onReconnecting: (_attempt: number) => {
          set({ status: 'reconnecting' });
        },
      }
    );

    connection.connect();
    set({ connection });
  },

  connectBLE: (bleDeviceId: string, deviceName?: string) => {
    const { connection: existingConnection } = get();
    if (existingConnection) {
      existingConnection.disconnect();
    }

    set({
      status: 'connecting',
      error: null,
      connectionType: 'ble',
      connectedAt: null,
      currentDevice: {
        name: deviceName || `BLE-${bleDeviceId.slice(-6)}`,
        host: bleDeviceId,
        port: 0,
        connectionType: 'ble',
        isOnline: true,
        lastSeen: new Date(),
      },
    });

    const manager = getBleManager();
    if (!manager) {
      set({ status: 'disconnected', error: 'Bluetooth is not available on this device.' });
      return;
    }

    const connection = new BleConnection(
      manager,
      bleDeviceId,
      {
        onConnect: () => {
          set({ status: 'connected', error: null, connectedAt: new Date() });
          useAppStore.getState().incrementConnectionCount();
          setTimeout(() => maybeRequestReview(), 5000);
        },
        onData: (data: string) => {
          useLogStore.getState().addLine(data);
        },
        onError: (error: Error) => {
          set({ error: error.message });
        },
        onClose: () => {
          const state = get();
          if (state.status !== 'disconnected') {
            set({ status: 'disconnected', connectedAt: null });
          }
        },
      }
    );

    connection.connect();
    set({ connection });
  },

  disconnect: () => {
    const { connection } = get();
    if (connection) {
      connection.disconnect();
    }
    set({
      status: 'disconnected',
      connection: null,
      currentDevice: null,
      error: null,
      connectionType: null,
      connectedAt: null,
    });
  },

  sendCommand: (command: string) => {
    const { connection } = get();
    if (connection) {
      connection.send(command);
    }
  },
}));
