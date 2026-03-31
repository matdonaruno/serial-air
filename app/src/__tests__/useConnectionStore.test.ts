import { useConnectionStore } from '../stores/useConnectionStore';

// Mock useLogStore and useSettingsStore
jest.mock('../stores/useLogStore', () => ({
  useLogStore: {
    getState: () => ({ addLine: jest.fn() }),
  },
}));

jest.mock('../stores/useSettingsStore', () => ({
  useSettingsStore: {
    getState: () => ({
      connectionTimeout: 10000,
      autoReconnect: true,
      reconnectInterval: 5000,
    }),
  },
}));

describe('useConnectionStore', () => {
  beforeEach(() => {
    useConnectionStore.setState({
      status: 'disconnected',
      currentDevice: null,
      error: null,
      connection: null,
      connectionType: null,
      connectedAt: null,
    });
  });

  describe('initial state', () => {
    it('should start disconnected', () => {
      const state = useConnectionStore.getState();
      expect(state.status).toBe('disconnected');
      expect(state.currentDevice).toBeNull();
      expect(state.connection).toBeNull();
      expect(state.connectionType).toBeNull();
      expect(state.connectedAt).toBeNull();
    });
  });

  describe('connect', () => {
    it('should set status to connecting', () => {
      useConnectionStore.getState().connect('192.168.4.1', 23, 'TestDevice');

      const state = useConnectionStore.getState();
      expect(state.status).toBe('connecting');
      expect(state.connectionType).toBe('wifi');
      expect(state.connectedAt).toBeNull();
      expect(state.currentDevice).not.toBeNull();
      expect(state.currentDevice?.name).toBe('TestDevice');
      expect(state.currentDevice?.host).toBe('192.168.4.1');
      expect(state.currentDevice?.port).toBe(23);
    });

    it('should use host:port as name when no name provided', () => {
      useConnectionStore.getState().connect('10.0.0.1', 8080);

      const device = useConnectionStore.getState().currentDevice;
      expect(device?.name).toBe('10.0.0.1:8080');
    });

    it('should create a connection instance', () => {
      useConnectionStore.getState().connect('192.168.4.1', 23);

      expect(useConnectionStore.getState().connection).not.toBeNull();
    });
  });

  describe('disconnect', () => {
    it('should reset all state', () => {
      // First connect
      useConnectionStore.getState().connect('192.168.4.1', 23, 'Test');

      // Then disconnect
      useConnectionStore.getState().disconnect();

      const state = useConnectionStore.getState();
      expect(state.status).toBe('disconnected');
      expect(state.currentDevice).toBeNull();
      expect(state.connection).toBeNull();
      expect(state.connectionType).toBeNull();
      expect(state.connectedAt).toBeNull();
      expect(state.error).toBeNull();
    });
  });

  describe('sendCommand', () => {
    it('should not throw when no connection', () => {
      expect(() => {
        useConnectionStore.getState().sendCommand('test');
      }).not.toThrow();
    });
  });
});
