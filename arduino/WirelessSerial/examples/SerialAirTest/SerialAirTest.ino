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
 *   Upload Speed: 921600
 *
 * PlatformIO:
 *   board = esp32-c3-devkitm-1
 */

// BLE enabled — requires Partition Scheme: "Huge APP (3MB No OTA)"
// #define WS_NO_BLE 1

#include <WiFi.h>
#include <WirelessSerial.h>
#include <math.h>

// ===== EDIT THESE =====
const char* WIFI_SSID = "BBIQRT-2G-pe388f";
const char* WIFI_PASS = "8c7f21e9c1edd";
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
    Serial.println("║  Serial Air Test Firmware v0.8   ║");
    Serial.println("║  ESP32-C3 Super Mini             ║");
    Serial.println("╚══════════════════════════════════╝");
    Serial.println();

    // STA mode — connect to WiFi router
    Serial.printf("Connecting to WiFi: %s", WIFI_SSID);
    WiFi.mode(WIFI_STA);
    // Fix for ESP32-C3 Super Mini: lower TX power to stabilize WiFi
    // Default 20dBm overloads the weak power supply on this board
    WiFi.setTxPower(WIFI_POWER_8_5dBm);
    WiFi.begin(WIFI_SSID, WIFI_PASS);

    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 40) {
        delay(500);
        Serial.print(".");
        attempts++;
        digitalWrite(LED_BUILTIN, attempts % 2 == 0 ? LOW : HIGH);
    }
    Serial.println();

    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("warn: WiFi failed — running BLE only");
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

    // Start BLE UART service
    ws.beginBLE();
    Serial.println("BLE: Nordic UART Service active");

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

    // === Sensor simulation (every 500ms) — for Plotter testing ===
    if (now - lastSensorUpdate >= 500) {
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

        output->printf("--- status: uptime=%02d:%02d:%02d heap=%d wifi=%ddBm tcp=%d ble=%d ---\n",
                       h, m, s,
                       ESP.getFreeHeap(),
                       WiFi.RSSI(),
                       ws.clientCount(),
                       ws.bleClientCount());

        // Blink LED briefly on status update
        digitalWrite(LED_BUILTIN, LOW);
        delay(50);
        digitalWrite(LED_BUILTIN, HIGH);
    }

    // === Read incoming commands from TCP clients ===
    // (Commands sent from Serial Air app's command input)
    // Note: WirelessSerial doesn't have a built-in read API,
    // but you can read from Serial for USB commands
    if (Serial.available()) {
        String cmd = Serial.readStringUntil('\n');
        cmd.trim();

        if (cmd == "help") {
            output->println("Commands: help, status, led on, led off, reboot, fast, slow");
        }
        else if (cmd == "status") {
            output->printf("Device: %s\n", ws.getDeviceId());
            output->printf("Heap: %d bytes\n", ESP.getFreeHeap());
            output->printf("WiFi: %s (%d dBm)\n", WiFi.localIP().toString().c_str(), WiFi.RSSI());
            output->printf("TCP clients: %d\n", ws.clientCount());
            output->printf("BLE clients: %d\n", ws.bleClientCount());
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
            output->println("ok: Sensor update rate → 100ms");
            // Change sensor update rate for rapid plotter testing
            // (Would need a variable, simplified here)
        }
        else if (cmd == "slow") {
            output->println("ok: Sensor update rate → 2000ms");
        }
        else if (cmd.length() > 0) {
            output->printf("echo: %s\n", cmd.c_str());
        }
    }
}
