# WirelessSerial — API Reference

## Class: WirelessSerial

Inherits from `Print`. Provides TCP server for wireless serial monitoring.

### Constructor

```cpp
WirelessSerial ws;
```

### begin(port, mdnsName)

Start TCP server and register mDNS service.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| port | `uint16_t` | 23 | TCP port number |
| mdnsName | `const char*` | "esp-serial" | mDNS service name |

```cpp
ws.begin();                     // Default: port 23, name "esp-serial"
ws.begin(8023);                 // Custom port
ws.begin(23, "my-sensor");      // Custom mDNS name
```

### stop()

Stop TCP server and disconnect all clients.

```cpp
ws.stop();
```

### handle()

Process client connections and cleanup. **Must be called in `loop()`**.

```cpp
void loop() {
    ws.handle();
    // ...
}
```

### mirror(serial)

Enable mirror mode. Returns a `DualPrint*` that sends to both the given Print and TCP.

| Parameter | Type | Description |
|-----------|------|-------------|
| serial | `Print&` | Output to mirror (typically `Serial`) |

Returns: `DualPrint*` — use this for output.

```cpp
DualPrint* output = ws.mirror(Serial);
output->println("Goes to Serial and TCP");
```

### unmirror()

Disable mirror mode and free the DualPrint instance.

### isMirroring()

Returns `true` if mirror mode is active.

### getDualPrint()

Returns the current `DualPrint*` instance, or `nullptr` if not mirroring.

### write(byte) / write(buffer, size)

Send data directly to TCP clients only (not to Serial).

```cpp
ws.println("TCP only message");
```

### clientCount()

Returns the number of currently connected TCP clients.

### isRunning()

Returns `true` if the TCP server is running.

### setMaxClients(n)

Set maximum number of simultaneous TCP clients (1–5, default: 3). Call before `begin()`.

```cpp
ws.setMaxClients(2);
ws.begin();
```

## Class: DualPrint

Inherits from `Print`. Writes to two Print destinations simultaneously.

### Constructor

```cpp
DualPrint dp(Serial, ws);
```

### write(byte) / write(buffer, size)

Writes to both primary and secondary Print targets.

## Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `WIRELESS_SERIAL_VERSION` | "1.0.0" | Library version |
| `WIRELESS_SERIAL_DEFAULT_PORT` | 23 | Default TCP port |
| `WIRELESS_SERIAL_DEFAULT_MDNS` | "esp-serial" | Default mDNS name |
| `WIRELESS_SERIAL_MAX_CLIENTS_LIMIT` | 5 | Maximum allowed clients |
| `WIRELESS_SERIAL_DEFAULT_MAX_CLIENTS` | 3 | Default max clients |

## mDNS TXT Records

When `begin()` is called, these TXT records are published:

| Key | Value | Example |
|-----|-------|---------|
| version | Library version | "1.0.0" |
| device | Platform | "ESP8266" or "ESP32" |
