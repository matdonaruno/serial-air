import { BleManager, Device as BleDevice, State } from 'react-native-ble-plx';
import { Device } from '../types';
import { Platform, PermissionsAndroid } from 'react-native';

// Nordic UART Service UUID — only discover devices advertising this
const NUS_SERVICE_UUID = '6E400001-B5A3-F393-E0A9-E50E24DCCA9E';

export class BleDiscovery {
  private manager: BleManager;
  private onDeviceFound: (device: Device) => void;
  private onDeviceLost: (name: string) => void;
  private scanning = false;
  private discoveredIds = new Set<string>();

  constructor(
    manager: BleManager,
    onDeviceFound: (device: Device) => void,
    onDeviceLost: (name: string) => void,
  ) {
    this.manager = manager;
    this.onDeviceFound = onDeviceFound;
    this.onDeviceLost = onDeviceLost;
  }

  async startScan(): Promise<void> {
    if (this.scanning) return;

    // Check Bluetooth state
    const state = await this.manager.state();
    if (state !== State.PoweredOn) {
      console.warn('[BleDiscovery] Bluetooth not powered on:', state);
      return;
    }

    // Request Android permissions if needed
    if (Platform.OS === 'android') {
      const granted = await this._requestAndroidPermissions();
      if (!granted) {
        console.warn('[BleDiscovery] Bluetooth permissions denied');
        return;
      }
    }

    this.scanning = true;
    this.discoveredIds.clear();

    this.manager.startDeviceScan(
      [NUS_SERVICE_UUID],
      { allowDuplicates: false },
      (error, bleDevice) => {
        if (error) {
          console.warn('[BleDiscovery] Scan error:', error.message);
          return;
        }
        if (!bleDevice) return;

        // Skip already discovered
        if (this.discoveredIds.has(bleDevice.id)) return;
        this.discoveredIds.add(bleDevice.id);

        const device: Device = {
          name: bleDevice.localName || bleDevice.name || `BLE-${bleDevice.id.slice(-6)}`,
          host: bleDevice.id, // BLE device ID used as "host" identifier
          port: 0,            // Not applicable for BLE
          deviceType: 'ESP32',
          deviceId: bleDevice.localName || bleDevice.name || undefined,
          connectionType: 'ble',
          isOnline: true,
          lastSeen: new Date(),
        };

        this.onDeviceFound(device);
      },
    );
  }

  stopScan(): void {
    if (!this.scanning) return;
    this.scanning = false;
    this.manager.stopDeviceScan();
  }

  isScanning(): boolean {
    return this.scanning;
  }

  destroy(): void {
    this.stopScan();
  }

  getManager(): BleManager {
    return this.manager;
  }

  private async _requestAndroidPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;

    try {
      const results = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);

      return Object.values(results).every(
        (r) => r === PermissionsAndroid.RESULTS.GRANTED,
      );
    } catch {
      return false;
    }
  }
}
