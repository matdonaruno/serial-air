class Zeroconf {
  private listeners: Record<string, Function[]> = {};

  on(event: string, cb: Function) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(cb);
  }

  scan() {}
  stop() {}
  removeDeviceListeners() {}

  _emit(event: string, data: any) {
    (this.listeners[event] || []).forEach((cb) => cb(data));
  }
}

export default Zeroconf;
