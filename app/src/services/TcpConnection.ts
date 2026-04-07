import TcpSocket from 'react-native-tcp-socket';
import { TcpConnectionOptions, TcpConnectionEvents } from '../types';
import { Connection } from './Connection';
import {
  CONNECTION_TIMEOUT_MS,
  RECONNECT_INTERVAL_MS,
} from '../constants/defaults';

const MAX_RECONNECT_ATTEMPTS = 15;
const MAX_RECONNECT_INTERVAL_MS = 30_000;

export class TcpConnection implements Connection {
  private socket: ReturnType<typeof TcpSocket.createConnection> | null = null;
  private options: Required<TcpConnectionOptions>;
  private events: TcpConnectionEvents;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempt = 0;
  private intentionalClose = false;
  private buffer = '';

  constructor(options: TcpConnectionOptions, events: TcpConnectionEvents) {
    this.options = {
      timeout: CONNECTION_TIMEOUT_MS,
      reconnect: true,
      reconnectInterval: RECONNECT_INTERVAL_MS,
      ...options,
    };
    this.events = events;
  }

  connect(): void {
    this.intentionalClose = false;
    this.reconnectAttempt = 0;
    this._connect();
  }

  disconnect(): void {
    this.intentionalClose = true;
    this._clearReconnectTimer();
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
    }
  }

  send(data: string): void {
    if (this.socket) {
      this.socket.write(data + '\n');
    }
  }

  isConnected(): boolean {
    return this.socket !== null && !this.socket.destroyed;
  }

  private _connect(): void {
    try {
      this.socket = TcpSocket.createConnection(
        {
          host: this.options.host,
          port: this.options.port,
        } as any,
        () => {
          this.reconnectAttempt = 0;
          this.events.onConnect();
        }
      );

      this.socket.setEncoding('utf8');

      this.socket.on('data', (data) => {
        const text = typeof data === 'string' ? data : data.toString('utf8');
        this.buffer += text;

        // Prevent unbounded buffer growth (max 64KB)
        if (this.buffer.length > 65536) {
          this.buffer = this.buffer.slice(-32768);
        }

        const lines = this.buffer.split('\n');
        // Keep the last incomplete line in the buffer
        this.buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.length > 0) {
            // Filter out protocol messages (start with \x01)
            if (line.charCodeAt(0) === 1) continue;
            this.events.onData(line);
          }
        }
      });

      this.socket.on('error', (error) => {
        this.events.onError(error);
      });

      this.socket.on('close', () => {
        this.socket = null;
        this.events.onClose();

        if (!this.intentionalClose && this.options.reconnect) {
          this._scheduleReconnect();
        }
      });

      this.socket.on('timeout', () => {
        this.events.onError(new Error('Connection timeout'));
        this.socket?.destroy();
      });
    } catch (error) {
      this.events.onError(
        error instanceof Error ? error : new Error(String(error))
      );
      if (!this.intentionalClose && this.options.reconnect) {
        this._scheduleReconnect();
      }
    }
  }

  private _scheduleReconnect(): void {
    this._clearReconnectTimer();
    this.reconnectAttempt++;

    if (this.reconnectAttempt > MAX_RECONNECT_ATTEMPTS) {
      this.events.onError(
        new Error(`Reconnect failed after ${MAX_RECONNECT_ATTEMPTS} attempts`),
      );
      this.events.onClose();
      return;
    }

    this.events.onReconnecting(this.reconnectAttempt);

    // Exponential backoff: 5s, 10s, 20s, ... capped at 30s
    const delay = Math.min(
      this.options.reconnectInterval * Math.pow(2, this.reconnectAttempt - 1),
      MAX_RECONNECT_INTERVAL_MS,
    );

    this.reconnectTimer = setTimeout(() => {
      this._connect();
    }, delay);
  }

  private _clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}
