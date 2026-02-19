# Troubleshooting

## Device Not Found (mDNS)

**Symptoms**: Device doesn't appear in the Serial Air app.

**Solutions**:
1. Ensure both iPhone and ESP are on the same WiFi network
2. Check that `ws.begin()` is called after WiFi connection
3. Verify `ws.handle()` is called in `loop()`
4. Some routers block mDNS — try manual IP connection
5. Restart the app or toggle WiFi on iPhone

## Cannot Connect (TCP)

**Symptoms**: "Connection timeout" or "Connection refused"

**Solutions**:
1. Verify the ESP IP address (print it in Serial monitor)
2. Check that port 23 isn't blocked by your network
3. Ensure no firewall is blocking the connection
4. Try a custom port if 23 is in use: `ws.begin(8023)`

## AP Mode — Captive Portal Issue

**Symptoms**: iPhone shows captive portal or switches to cellular.

**Solutions**:
1. Go to iPhone Settings > WiFi > tap the ESP network
2. Disable "Auto-Join" then manually connect
3. Use manual IP connection in the app: `192.168.4.1:23`
4. Consider adding DNS response in your ESP sketch

## No Data Received

**Symptoms**: Connected but no log output.

**Solutions**:
1. Verify you're using `output->println()` (DualPrint) not `Serial.println()`
2. Or use `ws.println()` for TCP-only output
3. Check that `ws.handle()` is in your `loop()`
4. Test with telnet: `telnet <ESP_IP> 23`

## App Crashes or High Memory

**Symptoms**: App becomes slow or crashes with large logs.

**Solutions**:
1. Reduce max lines in Settings (default: 10,000)
2. Clear logs periodically
3. Use the filter to reduce rendered lines
4. Export logs before clearing

## ESP8266 Out of Memory

**Symptoms**: ESP crashes or resets.

**Solutions**:
1. Monitor heap: `ESP.getFreeHeap()`
2. Reduce max clients: `ws.setMaxClients(1)`
3. Avoid `String` class — use C strings where possible
4. Keep your sketch's memory usage under 40KB

## Build Issues (iOS App)

**Symptoms**: Build fails or native modules missing.

**Solutions**:
1. Use Development Build, not Expo Go
2. Run `npx expo prebuild --clean`
3. Clean Xcode: Product > Clean Build Folder
4. Delete `node_modules` and reinstall
