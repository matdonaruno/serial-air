/**
 * SerialAirTest — Full test firmware for Serial Air app
 *
 * Board: ESP32-C3 Super Mini (also works on ESP32/ESP32-S3)
 *
 * Features tested:
 *   - WiFi connection + mDNS discovery
 *   - BLE UART (Nordic UART Service)
 *   - Device ID (MAC-based)
 *   - Serial mirror (Serial → WiFi + BLE)
 *   - Numeric data for Serial Plotter
 *   - Command reception (two-way communication)
 *   - Ring buffer (offline data retention)
 *
 * Arduino IDE Setup:
 *   Board: "ESP32C3 Dev Module"
 *   USB CDC On Boot: Enabled
 *   Partition Scheme: "Huge APP (3MB No OTA)" if BLE enabled
 *   Upload Speed: 921600
 *
 * WiFi Tips:
 *   - If "Association refused": wait 10s+ between resets
 *   - WPA (not WPA2) router: WiFi.setMinSecurity() is set below
 *   - ESP32-C3 Super Mini: weak antenna, keep close to router
 *   - WiFi.setAutoReconnect(true): auto-retry in background
 *   - Check WiFi.RSSI() — above -70dBm recommended
 *
 * PlatformIO:
 *   board = esp32-c3-devkitm-1
 */

// BLE is ON by default on ESP32.
// Requires: Arduino IDE → Tools → Partition Scheme → "Huge APP (3MB No OTA)"
// BLE enabled for demo (comment out WS_NO_BLE to enable)
// #define WS_NO_BLE 1

#include <WiFi.h>
#include <WirelessSerial.h>
#include <math.h>

// ===== EDIT THESE =====
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";
// ======================

WirelessSerial ws;
Print* output;  // Dual output: Serial + WiFi/BLE

// Simulated sensor values for plotter testing
float temperature = 25.0;
float humidity = 50.0;
float pressure = 1013.25;

unsigned long lastSensorUpdate = 0;
unsigned long lastStatusUpdate = 0;
unsigned long bootTime = 0;
unsigned long sensorInterval = 500;


void processCommand(String cmd) {
    cmd.trim();
    if (cmd.length() == 0) return;

    if (cmd == "help") {
        output->println("Commands: help, status, led on, led off, reboot, fast, slow");
    }
    else if (cmd == "status") {
        output->printf("Device: %s\n", ws.getDeviceId());
        output->printf("Heap: %d bytes\n", ESP.getFreeHeap());
        output->printf("WiFi: %s (%d dBm)\n", WiFi.localIP().toString().c_str(), WiFi.RSSI());
        output->printf("TCP clients: %d\n", ws.clientCount());
#if WS_BLE_ENABLED
        output->printf("BLE clients: %d\n", ws.bleClientCount());
#else
        output->println("BLE: disabled");
#endif
        output->printf("Buffer: %d bytes\n", ws.bufferedBytes());
    }
    else if (cmd == "led on") {
        digitalWrite(LED_BUILTIN, LOW); // Active low
        output->println("ok: LED on");
    }
    else if (cmd == "led off") {
        digitalWrite(LED_BUILTIN, HIGH);
        output->println("ok: LED off");
    }
    else if (cmd == "reboot") {
        output->println("Rebooting in 1s...");
        delay(1000);
        ESP.restart();
    }
    else if (cmd == "fast") {
        sensorInterval = 100;
        output->println("ok: Sensor update rate → 100ms");
    }
    else if (cmd == "slow") {
        sensorInterval = 2000;
        output->println("ok: Sensor update rate → 2000ms");
    }
    else {
        output->printf("echo: %s\n", cmd.c_str());
    }
}

// LED pin (ESP32-C3 Super Mini built-in LED = GPIO8)
#ifndef LED_BUILTIN
  #define LED_BUILTIN 8
#endif

void setup() {
    Serial.begin(115200);
    delay(1000); // Wait for USB CDC

    pinMode(LED_BUILTIN, OUTPUT);
    digitalWrite(LED_BUILTIN, HIGH); // LED off (active low on C3 Super Mini)

    Serial.println();
    Serial.println("╔══════════════════════════════════╗");
    Serial.println("║  Serial Air Test Firmware v2.1   ║");
    Serial.println("║  ESP32-C3 Super Mini             ║");
    Serial.println("╚══════════════════════════════════╝");
    Serial.println();

    // STA mode — connect to WiFi router
    Serial.printf("WiFi SSID: [%s] (len=%d)\n", WIFI_SSID, strlen(WIFI_SSID));
    Serial.printf("WiFi PASS: [%s] (len=%d)\n", WIFI_PASS, strlen(WIFI_PASS));
    WiFi.mode(WIFI_STA);
    WiFi.disconnect(true);
    delay(500);

    // Allow WPA1 connections (ESP32 defaults to WPA2 minimum)
    WiFi.setMinSecurity(WIFI_AUTH_WPA_PSK);
    WiFi.disconnect(true, true);
    delay(1000);
    Serial.printf("Connecting to %s (will keep retrying in background)...\n", WIFI_SSID);
    WiFi.setAutoReconnect(true);
    WiFi.begin(WIFI_SSID, WIFI_PASS);

    // Wait up to 15 seconds for initial connection
    for (int t = 0; t < 15 && WiFi.status() != WL_CONNECTED; t++) {
        delay(1000);
        Serial.print(".");
    }
    Serial.println();

    if (WiFi.status() != WL_CONNECTED) {
        Serial.printf("WiFi not ready yet (status=%d) - starting anyway, will connect in background\n", WiFi.status());
    } else {
        Serial.printf("ok: Connected! IP: %s\n", WiFi.localIP().toString().c_str());
        Serial.printf("RSSI: %d dBm\n", WiFi.RSSI());
    }

    // Enable ring buffer (keeps data while no client is connected)
    ws.enableBuffer(2048);

    // Start WiFi TCP server + mDNS
    ws.begin(23, "serial-air-test");
    Serial.printf("Device ID: %s\n", ws.getDeviceId());
    Serial.printf("TCP: port 23\n");
    Serial.printf("mDNS: serial-air-test.local\n");

#if WS_BLE_ENABLED
    if (WiFi.status() == WL_CONNECTED) {
        ws.beginBLE();
        Serial.println("BLE: active");
        Serial.printf("Heap after BLE: %d\n", ESP.getFreeHeap());
    } else {
        ws.beginBLE();
        Serial.println("BLE: active (WiFi off)");
    }
#else
    Serial.println("BLE: disabled (WS_NO_BLE)");
#endif

    // Mirror: Serial output → WiFi + BLE
    output = ws.mirror(Serial);

    Serial.println();
    Serial.println("=== Ready! Connect with Serial Air app ===");
    Serial.println();

    digitalWrite(LED_BUILTIN, HIGH); // LED off
    bootTime = millis();
}

void loop() {
    ws.handle();

    unsigned long now = millis();

    // === Sensor simulation — for Plotter testing ===
    if (now - lastSensorUpdate >= sensorInterval) {
        lastSensorUpdate = now;

        float elapsed = (now - bootTime) / 1000.0;

        // Simulate realistic sensor fluctuations
        temperature = 25.0 + 3.0 * sin(elapsed * 0.1) + random(-10, 10) * 0.05;
        humidity    = 50.0 + 10.0 * cos(elapsed * 0.07) + random(-10, 10) * 0.1;
        pressure    = 1013.25 + 2.0 * sin(elapsed * 0.05) + random(-10, 10) * 0.02;

        // Output in plotter-friendly format (key:value pairs)
        output->printf("temp:%.1f hum:%.1f pres:%.1f\n",
                       temperature, humidity, pressure);
    }

    // === Status report (every 5s) ===
    if (now - lastStatusUpdate >= 5000) {
        lastStatusUpdate = now;

        unsigned long uptime = (now - bootTime) / 1000;
        int h = uptime / 3600;
        int m = (uptime % 3600) / 60;
        int s = uptime % 60;

        output->printf("--- status: uptime=%02d:%02d:%02d IP=%s heap=%d wifi=%ddBm tcp=%d ble=%d ---\n",
                       h, m, s,
                       WiFi.localIP().toString().c_str(),
                       ESP.getFreeHeap(),
                       WiFi.RSSI(),
                       ws.clientCount(),

#if WS_BLE_ENABLED
                       ws.bleClientCount()
#else
                       0
#endif
                       );

        // Blink LED briefly on status update
        digitalWrite(LED_BUILTIN, LOW);
        delay(50);
        digitalWrite(LED_BUILTIN, HIGH);
    }

    // === Read commands from USB Serial ===
    if (Serial.available()) {
        String cmd = Serial.readStringUntil('\n');
        processCommand(cmd);
    }

    // === Read commands from TCP (app's command input) ===
    if (ws.available()) {
        String cmd = ws.readStringUntil('\n');
        processCommand(cmd);
    }
}
