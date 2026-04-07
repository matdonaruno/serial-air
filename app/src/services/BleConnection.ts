import { BleManager, Device, Characteristic } from 'react-native-ble-plx';
import { Connection } from './Connection';

// Nordic UART Service UUIDs (must match Arduino side)
const NUS_SERVICE_UUID = '6E400001-B5A3-F393-E0A9-E50E24DCCA9E';
const NUS_TX_CHAR_UUID = '6E400003-B5A3-F393-E0A9-E50E24DCCA9E'; // Server TX → App RX (notify)
const NUS_RX_CHAR_UUID = '6E400002-B5A3-F393-E0A9-E50E24DCCA9E'; // App TX → Server RX (write)

// SECURITY NOTE: BLE NUS data is Base64-encoded but NOT encrypted at application layer.
// BLE 4.2+ link-layer encryption is available when devices are paired/bonded, but
// react-native-ble-plx does not expose pairing control. Serial data transmitted over
// BLE can be sniffed by nearby BLE devices within ~10m range.
// For sensitive data, use the WiFi+security password mode instead.

export interface BleConnectionEvents {
  onConnect: () => void;
  onData: (data: string) => void;
  onError: (error: Error) => void;
  onClose: () => void;
}

export class BleConnection implements Connection {
  private manager: BleManager;
  private device: Device | null = null;
  private deviceId: string;
  private events: BleConnectionEvents;
  private connected = false;
  private buffer = '';

  constructor(
    manager: BleManager,
    deviceId: string,
    events: BleConnectionEvents,
  ) {
    this.manager = manager;
    this.deviceId = deviceId;
    this.events = events;
  }

  async connect(): Promise<void> {
    try {
      this.device = await this.manager.connectToDevice(this.deviceId, {
        requestMTU: 185,
      });

      await this.device.discoverAllServicesAndCharacteristics();

      // Monitor TX characteristic (device → app, notifications)
      this.device.monitorCharacteristicForService(
        NUS_SERVICE_UUID,
        NUS_TX_CHAR_UUID,
        (error, characteristic) => {
          if (error) {
            this.events.onError(new Error(error.message));
            return;
          }
          if (characteristic?.value) {
            const decoded = atob(characteristic.value);
            this._processData(decoded);
          }
        },
      );

      // Monitor disconnect
      this.manager.onDeviceDisconnected(this.deviceId, (error) => {
        this.connected = false;
        this.device = null;
        this.events.onClose();
      });

      this.connected = true;
      this.events.onConnect();
    } catch (error) {
      this.events.onError(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  disconnect(): void {
    if (this.device) {
      this.manager.cancelDeviceConnection(this.deviceId).catch(() => {});
      this.device = null;
    }
    this.connected = false;
  }

  async send(data: string): Promise<void> {
    if (!this.device || !this.connected) return;

    try {
      const encoded = btoa(data + '\n');
      await this.device.writeCharacteristicWithResponseForService(
        NUS_SERVICE_UUID,
        NUS_RX_CHAR_UUID,
        encoded,
      );
    } catch (error) {
      this.events.onError(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  private _processData(text: string): void {
    this.buffer += text;
    if (this.buffer.length > 65536) {
      this.buffer = this.buffer.slice(-32768);
    }
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.length > 0) {
        if (line.charCodeAt(0) === 1) continue;
        this.events.onData(line);
      }
    }
  }
}
