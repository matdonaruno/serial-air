export interface Device {
  name: string;
  host: string;
  port: number;
  deviceType?: string;
  libraryVersion?: string;
  isOnline: boolean;
  lastSeen: Date;
}

export interface LogLine {
  id: number;
  timestamp: Date;
  text: string;
  raw: string;
}

export interface RecentConnection {
  host: string;
  port: number;
  deviceName?: string;
  lastConnected: Date;
}

export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting';

export interface TcpConnectionOptions {
  host: string;
  port: number;
  timeout?: number;
  reconnect?: boolean;
  reconnectInterval?: number;
}

export interface TcpConnectionEvents {
  onConnect: () => void;
  onData: (data: string) => void;
  onError: (error: Error) => void;
  onClose: () => void;
  onReconnecting: (attempt: number) => void;
}

export interface SettingsState {
  // Display
  fontSize: number;
  showTimestamp: boolean;
  autoScroll: boolean;
  maxLines: number;
  colorTheme: 'dark' | 'light' | 'system';

  // Connection
  defaultPort: number;
  autoReconnect: boolean;
  reconnectInterval: number;
  connectionTimeout: number;

  // Log
  autoSave: boolean;
  maxFileSize: number;
}
