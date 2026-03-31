import { useTrustStore } from '../stores/useTrustStore';
import { TrustedDevice, DeviceFingerprint } from '../types';

describe('TrustStore - Fingerprint', () => {
  beforeEach(() => {
    useTrustStore.setState({ trustedDevices: [] });
  });

  const baseDevice: TrustedDevice = {
    deviceId: 'SA-AABBCCDDEEFF',
    name: 'Test ESP32',
    trustedAt: new Date(),
    lastSeen: new Date(),
    connectionType: 'wifi',
    fingerprint: {
      heapSize: 168000,
      libraryVersion: '1.2.0',
      deviceType: 'ESP32',
    },
  };

  describe('updateFingerprint', () => {
    it('should store fingerprint for a trusted device', () => {
      useTrustStore.getState().trustDevice(baseDevice);
      useTrustStore.getState().updateFingerprint('SA-AABBCCDDEEFF', {
        heapSize: 170000,
        libraryVersion: '1.2.0',
        deviceType: 'ESP32',
      });

      const device = useTrustStore.getState().getTrustedDevice('SA-AABBCCDDEEFF');
      expect(device?.fingerprint?.heapSize).toBe(170000);
    });
  });

  describe('checkFingerprint', () => {
    it('should return empty array when fingerprint matches', () => {
      useTrustStore.getState().trustDevice(baseDevice);

      const mismatches = useTrustStore.getState().checkFingerprint('SA-AABBCCDDEEFF', {
        heapSize: 168000,
        libraryVersion: '1.2.0',
        deviceType: 'ESP32',
      });

      expect(mismatches).toHaveLength(0);
    });

    it('should detect library version change', () => {
      useTrustStore.getState().trustDevice(baseDevice);

      const mismatches = useTrustStore.getState().checkFingerprint('SA-AABBCCDDEEFF', {
        heapSize: 168000,
        libraryVersion: '2.0.0',
        deviceType: 'ESP32',
      });

      expect(mismatches).toHaveLength(1);
      expect(mismatches[0].field).toBe('Version');
      expect(mismatches[0].expected).toBe('1.2.0');
      expect(mismatches[0].actual).toBe('2.0.0');
    });

    it('should detect device type change', () => {
      useTrustStore.getState().trustDevice(baseDevice);

      const mismatches = useTrustStore.getState().checkFingerprint('SA-AABBCCDDEEFF', {
        heapSize: 168000,
        libraryVersion: '1.2.0',
        deviceType: 'ESP8266',
      });

      expect(mismatches).toHaveLength(1);
      expect(mismatches[0].field).toBe('Device Type');
    });

    it('should detect significant heap size change (>30%)', () => {
      useTrustStore.getState().trustDevice(baseDevice);

      const mismatches = useTrustStore.getState().checkFingerprint('SA-AABBCCDDEEFF', {
        heapSize: 32000, // ~81% smaller
        libraryVersion: '1.2.0',
        deviceType: 'ESP32',
      });

      expect(mismatches).toHaveLength(1);
      expect(mismatches[0].field).toBe('Heap Size');
    });

    it('should allow small heap size variation (<30%)', () => {
      useTrustStore.getState().trustDevice(baseDevice);

      const mismatches = useTrustStore.getState().checkFingerprint('SA-AABBCCDDEEFF', {
        heapSize: 155000, // ~8% smaller, normal variation
        libraryVersion: '1.2.0',
        deviceType: 'ESP32',
      });

      expect(mismatches).toHaveLength(0);
    });

    it('should detect multiple mismatches', () => {
      useTrustStore.getState().trustDevice(baseDevice);

      const mismatches = useTrustStore.getState().checkFingerprint('SA-AABBCCDDEEFF', {
        heapSize: 32000,
        libraryVersion: '9.9.9',
        deviceType: 'FAKE',
      });

      expect(mismatches).toHaveLength(3);
    });

    it('should return empty array for unknown device', () => {
      const mismatches = useTrustStore.getState().checkFingerprint('SA-UNKNOWN', {
        heapSize: 168000,
        libraryVersion: '1.2.0',
        deviceType: 'ESP32',
      });

      expect(mismatches).toHaveLength(0);
    });

    it('should return empty array when device has no stored fingerprint', () => {
      useTrustStore.getState().trustDevice({
        ...baseDevice,
        fingerprint: undefined,
      });

      const mismatches = useTrustStore.getState().checkFingerprint('SA-AABBCCDDEEFF', {
        heapSize: 168000,
        libraryVersion: '1.2.0',
        deviceType: 'ESP32',
      });

      expect(mismatches).toHaveLength(0);
    });
  });

  describe('updatePassword', () => {
    it('should store password for a trusted device', () => {
      useTrustStore.getState().trustDevice(baseDevice);
      useTrustStore.getState().updatePassword('SA-AABBCCDDEEFF', 'secret123');

      const device = useTrustStore.getState().getTrustedDevice('SA-AABBCCDDEEFF');
      expect(device?.password).toBe('secret123');
    });
  });

  describe('getTrustedDevice', () => {
    it('should return device by ID', () => {
      useTrustStore.getState().trustDevice(baseDevice);

      const device = useTrustStore.getState().getTrustedDevice('SA-AABBCCDDEEFF');
      expect(device).toBeDefined();
      expect(device?.name).toBe('Test ESP32');
    });

    it('should return undefined for unknown ID', () => {
      const device = useTrustStore.getState().getTrustedDevice('SA-UNKNOWN');
      expect(device).toBeUndefined();
    });
  });
});
