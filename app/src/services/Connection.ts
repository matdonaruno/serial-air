export interface Connection {
  connect(): void;
  disconnect(): void;
  send(data: string): void;
  isConnected(): boolean;
}
