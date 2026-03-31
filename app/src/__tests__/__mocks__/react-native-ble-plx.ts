export enum State {
  PoweredOn = 'PoweredOn',
  PoweredOff = 'PoweredOff',
  Unknown = 'Unknown',
}

export class BleManager {
  state = jest.fn(async () => State.PoweredOn);
  startDeviceScan = jest.fn();
  stopDeviceScan = jest.fn();
  connectToDevice = jest.fn();
  cancelDeviceConnection = jest.fn();
  onDeviceDisconnected = jest.fn();
  destroy = jest.fn();
}

export class BleError extends Error {
  errorCode = 0;
}

export const BleErrorCode = {};
