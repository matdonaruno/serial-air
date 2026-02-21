declare module 'react-native-zeroconf' {
  import { EventEmitter } from 'events';

  interface Service {
    host: string;
    port: number;
    name: string;
    fullName: string;
    addresses: string[];
    txt: Record<string, string>;
  }

  class Zeroconf extends EventEmitter {
    scan(type?: string, protocol?: string, domain?: string): void;
    stop(): void;
    getListening(): boolean;
    removeDeviceListeners(): void;
  }

  export default Zeroconf;
  export { Service };
}
