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

    // Request Android permissions if needed
    if (Platform.OS === 'android') {
      const granted = await this._requestAndroidPermissions();
      if (!granted) {
        console.warn('[BleDiscovery] Bluetooth permissions denied');
        return;
      }
    }

    // On iOS, calling startDeviceScan triggers the Bluetooth permission dialog.
    // We listen for state changes to start scanning once BLE is ready.
    const state = await this.manager.state();
    if (state !== State.PoweredOn) {
      console.log('[BleDiscovery] BLE state:', state, '— waiting for PoweredOn');
      this.manager.onStateChange((newState) => {
        if (newState === State.PoweredOn && !this.scanning) {
          console.log('[BleDiscovery] BLE now PoweredOn, starting scan');
          this._startDeviceScan();
        }
      }, true);
      return;
    }

    this._startDeviceScan();
  }

  private _startDeviceScan(): void {
    this.scanning = true;
    this.discoveredIds.clear();

    this.manager.startDeviceScan(
      [NUS_SERVICE_UUID],
      { allowDuplicates: true },
      (error, bleDevice) => {
        if (error) {
          console.warn('[BleDiscovery] Scan error:', error.message);
          return;
        }
        if (!bleDevice) return;

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
      // Android 12+ needs BLUETOOTH_SCAN/CONNECT, Android 11- needs only LOCATION
      const apiLevel = Platform.Version;
      const permissions: string[] = [
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ];

      if (typeof apiLevel === 'number' && apiLevel >= 31) {
        // Android 12+
        if (PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN) {
          permissions.push(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN);
        }
        if (PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT) {
          permissions.push(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT);
        }
      }

      const results = await PermissionsAndroid.requestMultiple(permissions as any);

      return Object.values(results).every(
        (r) => r === PermissionsAndroid.RESULTS.GRANTED,
      );
    } catch (e) {
      console.warn('[BleDiscovery] Permission request failed:', e);
      return false;
    }
  }
}
