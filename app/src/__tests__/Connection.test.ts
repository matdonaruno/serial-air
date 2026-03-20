import { Connection } from '../services/Connection';
import { TcpConnection } from '../services/TcpConnection';

describe('Connection interface', () => {
  it('TcpConnection should implement Connection interface', () => {
    const events = {
      onConnect: jest.fn(),
      onData: jest.fn(),
      onError: jest.fn(),
      onClose: jest.fn(),
      onReconnecting: jest.fn(),
    };

    const tcp = new TcpConnection(
      { host: '192.168.4.1', port: 23 },
      events,
    );

    // Verify it satisfies the Connection interface
    const conn: Connection = tcp;
    expect(typeof conn.connect).toBe('function');
    expect(typeof conn.disconnect).toBe('function');
    expect(typeof conn.send).toBe('function');
    expect(typeof conn.isConnected).toBe('function');
  });

  it('TcpConnection should report not connected initially', () => {
    const events = {
      onConnect: jest.fn(),
      onData: jest.fn(),
      onError: jest.fn(),
      onClose: jest.fn(),
      onReconnecting: jest.fn(),
    };

    const tcp = new TcpConnection(
      { host: '192.168.4.1', port: 23 },
      events,
    );

    expect(tcp.isConnected()).toBe(false);
  });
});
