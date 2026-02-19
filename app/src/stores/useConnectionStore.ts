import { create } from 'zustand';
import { ConnectionStatus, Device } from '../types';
import { TcpConnection } from '../services/TcpConnection';
import { useLogStore } from './useLogStore';
import { useSettingsStore } from './useSettingsStore';

interface ConnectionStore {
  status: ConnectionStatus;
  currentDevice: Device | null;
  error: string | null;
  connection: TcpConnection | null;

  connect: (host: string, port: number, deviceName?: string) => void;
  disconnect: () => void;
  sendCommand: (command: string) => void;
}

export const useConnectionStore = create<ConnectionStore>((set, get) => ({
  status: 'disconnected',
  currentDevice: null,
  error: null,
  connection: null,

  connect: (host: string, port: number, deviceName?: string) => {
    const { connection: existingConnection } = get();
    if (existingConnection) {
      existingConnection.disconnect();
    }

    const settings = useSettingsStore.getState();

    set({
      status: 'connecting',
      error: null,
      currentDevice: {
        name: deviceName || `${host}:${port}`,
        host,
        port,
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
          set({ status: 'connected', error: null });
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
            set({ status: 'disconnected' });
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
    });
  },

  sendCommand: (command: string) => {
    const { connection } = get();
    if (connection) {
      connection.send(command);
    }
  },
}));
