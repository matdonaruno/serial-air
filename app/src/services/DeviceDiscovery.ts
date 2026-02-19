import Zeroconf from 'react-native-zeroconf';
import { Device } from '../types';
import { MDNS_SERVICE_TYPE, DEFAULT_PORT } from '../constants/defaults';

export class DeviceDiscovery {
  private zeroconf: Zeroconf;
  private onDeviceFound: (device: Device) => void;
  private onDeviceLost: (name: string) => void;
  private scanning = false;

  constructor(
    onDeviceFound: (device: Device) => void,
    onDeviceLost: (name: string) => void
  ) {
    this.zeroconf = new Zeroconf();
    this.onDeviceFound = onDeviceFound;
    this.onDeviceLost = onDeviceLost;

    this._setupListeners();
  }

  startScan(): void {
    if (this.scanning) return;
    this.scanning = true;
    this.zeroconf.scan(MDNS_SERVICE_TYPE, 'tcp.');
  }

  stopScan(): void {
    if (!this.scanning) return;
    this.scanning = false;
    this.zeroconf.stop();
  }

  isScanning(): boolean {
    return this.scanning;
  }

  destroy(): void {
    this.stopScan();
    this.zeroconf.removeDeviceListeners();
  }

  private _setupListeners(): void {
    this.zeroconf.on('resolved', (service: any) => {
      const device: Device = {
        name: service.name || 'Unknown Device',
        host: service.host || service.addresses?.[0] || '',
        port: service.port || DEFAULT_PORT,
        deviceType: service.txt?.device,
        libraryVersion: service.txt?.version,
        isOnline: true,
        lastSeen: new Date(),
      };

      if (device.host) {
        this.onDeviceFound(device);
      }
    });

    this.zeroconf.on('remove', (name: string) => {
      this.onDeviceLost(name);
    });

    this.zeroconf.on('error', (error: any) => {
      console.warn('[DeviceDiscovery] mDNS error:', error);
    });
  }
}
