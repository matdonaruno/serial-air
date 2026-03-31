/**
 * BLEMirror - WirelessSerial BLE + WiFi example (ESP32 only)
 *
 * Mirrors Serial output to both TCP (WiFi) and BLE (Nordic UART Service).
 * Connect with the Serial Air iOS app via WiFi or Bluetooth.
 *
 * Hardware: ESP32 (not ESP8266 — BLE requires ESP32)
 */

#include <WiFi.h>
#include <WirelessSerial.h>

// WiFi credentials
const char* WIFI_SSID = "YourSSID";
const char* WIFI_PASS = "YourPassword";

WirelessSerial ws;

void setup() {
    Serial.begin(115200);

    // Connect to WiFi
    WiFi.begin(WIFI_SSID, WIFI_PASS);
    Serial.print("Connecting to WiFi");
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println();
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());

    // Start WiFi TCP server + mDNS
    ws.begin();

    // Start BLE UART service (ESP32 only)
    ws.beginBLE(); // uses device ID as BLE name

    // Mirror Serial to both TCP and BLE
    Print* out = ws.mirror(Serial);

    Serial.println("WirelessSerial ready (WiFi + BLE)");
    Serial.print("Device ID: ");
    Serial.println(ws.getDeviceId());
}

void loop() {
    ws.handle();

    // Example: periodic output
    static unsigned long last = 0;
    if (millis() - last > 2000) {
        last = millis();
        Serial.print("Uptime: ");
        Serial.print(millis() / 1000);
        Serial.print("s | WiFi clients: ");
        Serial.print(ws.clientCount());
        Serial.print(" | BLE clients: ");
        Serial.println(ws.bleClientCount());
    }
}
