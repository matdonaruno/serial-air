import { Device, TrustedDevice, ConnectionStatus } from '../types';

describe('Type definitions', () => {
  describe('Device', () => {
    it('should accept full device with new fields', () => {
      const device: Device = {
        name: 'ESP32-Test',
        host: '192.168.4.1',
        port: 23,
        deviceType: 'ESP32',
        libraryVersion: '1.2.0',
        deviceId: 'SA-AABBCCDDEEFF',
        connectionType: 'wifi',
        isOnline: true,
        lastSeen: new Date(),
      };
      expect(device.deviceId).toBe('SA-AABBCCDDEEFF');
      expect(device.connectionType).toBe('wifi');
    });

    it('should accept device without optional fields', () => {
      const device: Device = {
        name: 'ESP8266-Test',
        host: '192.168.1.100',
        port: 23,
        isOnline: true,
        lastSeen: new Date(),
      };
      expect(device.deviceId).toBeUndefined();
      expect(device.connectionType).toBeUndefined();
    });

    it('should accept ble connectionType', () => {
      const device: Device = {
        name: 'BLE Device',
        host: '',
        port: 0,
        connectionType: 'ble',
        isOnline: true,
        lastSeen: new Date(),
      };
      expect(device.connectionType).toBe('ble');
    });
  });

  describe('TrustedDevice', () => {
    it('should require all fields', () => {
      const trusted: TrustedDevice = {
        deviceId: 'SA-112233445566',
        name: 'My ESP32',
        trustedAt: new Date(),
        lastSeen: new Date(),
        connectionType: 'wifi',
      };
      expect(trusted.deviceId).toBe('SA-112233445566');
      expect(trusted.connectionType).toBe('wifi');
    });

    it('should accept ble connectionType', () => {
      const trusted: TrustedDevice = {
        deviceId: 'SA-FFEEDDCCBBAA',
        name: 'BLE ESP32',
        trustedAt: new Date(),
        lastSeen: new Date(),
        connectionType: 'ble',
      };
      expect(trusted.connectionType).toBe('ble');
    });
  });

  describe('ConnectionStatus', () => {
    it('should include all valid statuses', () => {
      const statuses: ConnectionStatus[] = [
        'disconnected',
        'connecting',
        'connected',
        'reconnecting',
      ];
      expect(statuses).toHaveLength(4);
    });
  });
});
