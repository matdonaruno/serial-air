import { useTrustStore } from '../stores/useTrustStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TrustedDevice } from '../types';

describe('useTrustStore', () => {
  beforeEach(() => {
    // Reset store state
    useTrustStore.setState({ trustedDevices: [] });
    jest.clearAllMocks();
    (AsyncStorage as any)._store = {};
  });

  const mockDevice: TrustedDevice = {
    deviceId: 'SA-AABBCCDDEEFF',
    name: 'Test ESP32',
    trustedAt: new Date('2026-03-17'),
    lastSeen: new Date('2026-03-17'),
    connectionType: 'wifi',
  };

  describe('trustDevice', () => {
    it('should add a new trusted device', () => {
      const { trustDevice, trustedDevices } = useTrustStore.getState();
      expect(trustedDevices).toHaveLength(0);

      trustDevice(mockDevice);

      const updated = useTrustStore.getState().trustedDevices;
      expect(updated).toHaveLength(1);
      expect(updated[0].deviceId).toBe('SA-AABBCCDDEEFF');
      expect(updated[0].name).toBe('Test ESP32');
    });

    it('should update existing device instead of duplicating', () => {
      useTrustStore.getState().trustDevice(mockDevice);
      useTrustStore.getState().trustDevice({
        ...mockDevice,
        name: 'Updated ESP32',
      });

      const updated = useTrustStore.getState().trustedDevices;
      expect(updated).toHaveLength(1);
      expect(updated[0].name).toBe('Updated ESP32');
    });

    it('should persist to AsyncStorage', () => {
      useTrustStore.getState().trustDevice(mockDevice);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'serial-air:trusted-devices',
        expect.any(String),
      );
    });
  });

  describe('removeTrustedDevice', () => {
    it('should remove a device by ID', () => {
      useTrustStore.getState().trustDevice(mockDevice);
      expect(useTrustStore.getState().trustedDevices).toHaveLength(1);

      useTrustStore.getState().removeTrustedDevice('SA-AABBCCDDEEFF');
      expect(useTrustStore.getState().trustedDevices).toHaveLength(0);
    });

    it('should not affect other devices', () => {
      const device2: TrustedDevice = {
        ...mockDevice,
        deviceId: 'SA-112233445566',
        name: 'Other ESP32',
      };
      useTrustStore.getState().trustDevice(mockDevice);
      useTrustStore.getState().trustDevice(device2);
      expect(useTrustStore.getState().trustedDevices).toHaveLength(2);

      useTrustStore.getState().removeTrustedDevice('SA-AABBCCDDEEFF');

      const remaining = useTrustStore.getState().trustedDevices;
      expect(remaining).toHaveLength(1);
      expect(remaining[0].deviceId).toBe('SA-112233445566');
    });
  });

  describe('isDeviceTrusted', () => {
    it('should return true for trusted device', () => {
      useTrustStore.getState().trustDevice(mockDevice);
      expect(useTrustStore.getState().isDeviceTrusted('SA-AABBCCDDEEFF')).toBe(true);
    });

    it('should return false for unknown device', () => {
      expect(useTrustStore.getState().isDeviceTrusted('SA-UNKNOWN')).toBe(false);
    });
  });

  describe('loadTrustedDevices', () => {
    it('should load devices from AsyncStorage', async () => {
      const stored = JSON.stringify([mockDevice]);
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(stored);

      await useTrustStore.getState().loadTrustedDevices();

      const devices = useTrustStore.getState().trustedDevices;
      expect(devices).toHaveLength(1);
      expect(devices[0].deviceId).toBe('SA-AABBCCDDEEFF');
    });

    it('should handle empty storage gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      await useTrustStore.getState().loadTrustedDevices();

      expect(useTrustStore.getState().trustedDevices).toHaveLength(0);
    });

    it('should handle corrupt storage gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('not-json{{{');

      await useTrustStore.getState().loadTrustedDevices();

      // Should not throw, keeps empty array
      expect(useTrustStore.getState().trustedDevices).toHaveLength(0);
    });
  });
});
