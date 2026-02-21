import TcpSocket from 'react-native-tcp-socket';
import { TcpConnectionOptions, TcpConnectionEvents } from '../types';
import {
  CONNECTION_TIMEOUT_MS,
  RECONNECT_INTERVAL_MS,
} from '../constants/defaults';

export class TcpConnection {
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

        const lines = this.buffer.split('\n');
        // Keep the last incomplete line in the buffer
        this.buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.length > 0) {
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
    this.events.onReconnecting(this.reconnectAttempt);

    this.reconnectTimer = setTimeout(() => {
      this._connect();
    }, this.options.reconnectInterval);
  }

  private _clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}
