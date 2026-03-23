import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius, typography, neuShadow } from '../src/constants/theme';
import { t } from '../src/i18n';

type FeatherIconName = React.ComponentProps<typeof Feather>['name'];

interface BoardDef {
  id: string;
  name: string;
  icon: FeatherIconName;
  platform: 'arduino' | 'python';
  needsWifi: boolean;
  description: string;
  ideSetup: string;
}

const BOARDS: BoardDef[] = [
  {
    id: 'esp8266',
    name: 'ESP8266',
    icon: 'cpu',
    platform: 'arduino',
    needsWifi: true,
    description: 'NodeMCU, Wemos D1 Mini',
    ideSetup: 'NodeMCU 1.0 / Wemos D1 Mini',
  },
  {
    id: 'esp32',
    name: 'ESP32',
    icon: 'cpu',
    platform: 'arduino',
    needsWifi: true,
    description: 'ESP32 Dev, ESP32-C3, S3',
    ideSetup: 'ESP32 Dev Module / ESP32C3',
  },
  {
    id: 'arduino-esp01',
    name: 'Arduino + ESP-01',
    icon: 'plus-circle',
    platform: 'arduino',
    needsWifi: true,
    description: 'Uno/Mega + ESP-01 WiFi',
    ideSetup: 'Arduino Uno / Mega 2560',
  },
  {
    id: 'rpi-pico-w',
    name: 'Pico W',
    icon: 'cpu',
    platform: 'python',
    needsWifi: true,
    description: 'Raspberry Pi Pico W',
    ideSetup: 'Thonny / MicroPython',
  },
  {
    id: 'rpi',
    name: 'Raspberry Pi',
    icon: 'server',
    platform: 'python',
    needsWifi: false,
    description: 'Pi 3/4/5, Zero W',
    ideSetup: 'Python 3 (built-in)',
  },
  {
    id: 'orange-pi',
    name: 'Orange Pi',
    icon: 'server',
    platform: 'python',
    needsWifi: false,
    description: 'Orange Pi, Banana Pi',
    ideSetup: 'Python 3',
  },
];

function generateCode(boardId: string, ssid: string, password: string): string {
  switch (boardId) {
    case 'esp8266':
      return `/**
 * Serial Air — ESP8266 Test
 * Board: NodeMCU / Wemos D1 Mini
 * IDE: Arduino IDE → Board: "NodeMCU 1.0"
 */
#include <WirelessSerial.h>

const char* ssid = "${ssid}";
const char* password = "${password}";

WirelessSerial ws;
DualPrint* output;

void setup() {
    Serial.begin(115200);
    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid, password);
    Serial.print("Connecting");
    while (WiFi.status() != WL_CONNECTED) {
        delay(500); Serial.print(".");
    }
    Serial.println();
    Serial.print("IP: "); Serial.println(WiFi.localIP());

    ws.begin();
    output = ws.mirror(Serial);
    output->println("Serial Air ready!");
}

void loop() {
    ws.handle();
    output->printf("uptime:%lu heap:%u rssi:%d\\n",
        millis()/1000, ESP.getFreeHeap(), WiFi.RSSI());
    delay(2000);
}`;

    case 'esp32':
      return `/**
 * Serial Air — ESP32 Test
 * Board: ESP32 / ESP32-C3 / ESP32-S3
 * IDE: Arduino IDE → Board: "ESP32 Dev Module"
 * Note: For ESP32-C3, set USB CDC On Boot: Enabled
 */
#include <WiFi.h>
#include <WirelessSerial.h>

const char* ssid = "${ssid}";
const char* password = "${password}";

WirelessSerial ws;
Print* output;

void setup() {
    Serial.begin(115200);
    delay(500);

    WiFi.mode(WIFI_STA);
    WiFi.setTxPower(WIFI_POWER_8_5dBm); // Stabilize C3 Super Mini
    WiFi.begin(ssid, password);
    Serial.print("Connecting");
    while (WiFi.status() != WL_CONNECTED) {
        delay(500); Serial.print(".");
    }
    Serial.println();
    Serial.print("IP: "); Serial.println(WiFi.localIP());

    ws.begin();
    output = ws.mirror(Serial);
    output->println("Serial Air ready!");
    output->print("Device ID: ");
    output->println(ws.getDeviceId());
}

void loop() {
    ws.handle();
    float temp = 25.0 + random(-20, 20) * 0.1;
    output->printf("temp:%.1f heap:%u rssi:%d\\n",
        temp, ESP.getFreeHeap(), WiFi.RSSI());
    delay(2000);
}`;

    case 'arduino-esp01':
      return `/**
 * Serial Air — Arduino + ESP-01 WiFi Module
 * Board: Arduino Uno/Mega with ESP-01 on Serial1 or SoftwareSerial
 * Wiring: ESP-01 TX→Pin 2, RX→Pin 3, VCC→3.3V, GND→GND
 *
 * This uses AT commands to set up ESP-01 as a TCP server.
 * Serial Air connects to the ESP-01's IP on port 23.
 */
#include <SoftwareSerial.h>

SoftwareSerial esp(2, 3); // RX=2, TX=3

const char* ssid = "${ssid}";
const char* password = "${password}";

void espSend(const char* cmd, unsigned long wait = 2000) {
    esp.println(cmd);
    unsigned long t = millis();
    while (millis() - t < wait) {
        if (esp.available()) Serial.write(esp.read());
    }
    Serial.println();
}

void setup() {
    Serial.begin(115200);
    esp.begin(9600);
    Serial.println("=== Serial Air — Arduino + ESP-01 ===");

    espSend("AT+RST", 3000);
    espSend("AT+CWMODE=1");

    char buf[80];
    snprintf(buf, sizeof(buf), "AT+CWJAP=\\"%s\\",\\"%s\\"", "${ssid}", "${password}");
    espSend(buf, 10000);

    espSend("AT+CIPMUX=1");
    espSend("AT+CIPSERVER=1,23");
    espSend("AT+CIFSR");

    Serial.println("TCP server on port 23 — connect with Serial Air");
}

void loop() {
    // Forward ESP data to Serial
    while (esp.available()) Serial.write(esp.read());

    // Send sensor data every 2s
    static unsigned long last = 0;
    if (millis() - last > 2000) {
        last = millis();
        char msg[60];
        snprintf(msg, sizeof(msg), "uptime:%lu analog:%d\\r\\n",
            millis()/1000, analogRead(A0));
        // Send to all connected clients (channel 0)
        char cmd[20];
        snprintf(cmd, sizeof(cmd), "AT+CIPSEND=0,%d", strlen(msg));
        esp.println(cmd);
        delay(100);
        esp.print(msg);
    }
}`;

    case 'rpi-pico-w':
      return `"""
Serial Air — Raspberry Pi Pico W (MicroPython)
Save as main.py and upload to Pico W via Thonny

1. Install MicroPython on Pico W
2. Save this as main.py
3. Pico W connects to WiFi and starts TCP server on port 23
4. Open Serial Air app → enter Pico's IP
"""
import network
import socket
import time
import machine

SSID = "${ssid}"
PASSWORD = "${password}"
PORT = 23

# Connect to WiFi
wlan = network.WLAN(network.STA_IF)
wlan.active(True)
wlan.connect(SSID, PASSWORD)

print("Connecting to WiFi", end="")
while not wlan.isconnected():
    print(".", end="")
    time.sleep(0.5)

ip = wlan.ifconfig()[0]
print(f"\\nConnected! IP: {ip}")

# Start TCP server
server = socket.socket()
server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
server.bind(("0.0.0.0", PORT))
server.listen(1)
server.settimeout(0.1)
print(f"TCP server on port {PORT}")

temp_sensor = machine.ADC(4)  # Internal temp sensor
clients = []

while True:
    # Accept new clients
    try:
        cl, addr = server.accept()
        cl.setblocking(False)
        clients.append(cl)
        print(f"Client connected: {addr}")
    except:
        pass

    # Send data to all clients
    reading = temp_sensor.read_u16() * 3.3 / 65535
    temp = 27 - (reading - 0.706) / 0.001721
    msg = f"temp:{temp:.1f} uptime:{time.ticks_ms()//1000}s\\n"

    for cl in clients[:]:
        try:
            cl.send(msg.encode())
        except:
            clients.remove(cl)

    time.sleep(1)`;

    case 'rpi':
    case 'orange-pi':
      const name = boardId === 'rpi' ? 'Raspberry Pi' : 'Orange Pi';
      return `#!/usr/bin/env python3
"""
Serial Air — ${name} TCP Server
Run: python3 serial_air_server.py

Starts a TCP server on port 23.
Open Serial Air app → enter this device's IP address.
"""
import socket
import threading
import time
import os

HOST = "0.0.0.0"
PORT = 23

server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
server.bind((HOST, PORT))
server.listen(5)

ip = socket.gethostbyname(socket.gethostname())
print(f"=== Serial Air — ${name} ===")
print(f"IP: {ip}")
print(f"TCP server on port {PORT}")
print("Waiting for Serial Air connection...\\n")

def handle_client(conn, addr):
    print(f"Client connected: {addr}")
    try:
        uptime_start = time.time()
        while True:
            uptime = int(time.time() - uptime_start)
            load = os.getloadavg()[0]

            # Read CPU temperature
            try:
                with open("/sys/class/thermal/thermal_zone0/temp") as f:
                    cpu_temp = int(f.read().strip()) / 1000
            except:
                cpu_temp = 0

            msg = f"temp:{cpu_temp:.1f} load:{load:.2f} uptime:{uptime}s\\n"
            conn.sendall(msg.encode())
            time.sleep(1)
    except (BrokenPipeError, ConnectionResetError):
        print(f"Client disconnected: {addr}")
    finally:
        conn.close()

while True:
    conn, addr = server.accept()
    threading.Thread(target=handle_client, args=(conn, addr), daemon=True).start()`;

    default:
      return '';
  }
}

export default function CodeGeneratorScreen() {
  const [boardId, setBoardId] = useState('esp32');
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);

  const board = BOARDS.find((b) => b.id === boardId)!;

  const code = useMemo(
    () => generateCode(boardId, ssid || 'YOUR_WIFI_SSID', password || 'YOUR_WIFI_PASSWORD'),
    [boardId, ssid, password]
  );

  const handleCopy = async () => {
    await Clipboard.setStringAsync(code);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.back();
        }} hitSlop={12}>
          <View style={styles.backButton}>
            <Feather name="arrow-left" size={20} color={colors.text.secondary} />
          </View>
        </Pressable>
        <Text style={styles.headerTitle}>{t('codegen_title')}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Intro */}
        <Text style={styles.introText}>
          {t('codegen_intro')}
        </Text>

        {/* Board Selection */}
        <Text style={styles.sectionLabel}>{t('codegen_select_board')}</Text>
        <View style={styles.boardGrid}>
          {BOARDS.map((b) => (
            <Pressable
              key={b.id}
              style={[styles.boardButton, boardId === b.id && styles.boardButtonActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setBoardId(b.id);
              }}
            >
              <Feather
                name={b.icon}
                size={18}
                color={boardId === b.id ? colors.accent.primary : colors.text.muted}
              />
              <Text style={[styles.boardName, boardId === b.id && styles.boardNameActive]}>
                {b.name}
              </Text>
              <Text style={styles.boardDesc}>{b.description}</Text>
            </Pressable>
          ))}
        </View>

        {/* WiFi Credentials (only for boards that need it) */}
        {board.needsWifi && (
          <>
            <Text style={styles.sectionLabel}>{t('codegen_wifi_creds')}</Text>
            <View style={styles.inputCard}>
              <View style={styles.inputRow}>
                <Feather name="wifi" size={18} color={colors.text.muted} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder={t('codegen_ssid_placeholder')}
                  placeholderTextColor={colors.text.muted}
                  value={ssid}
                  onChangeText={setSsid}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <View style={styles.divider} />
              <View style={styles.inputRow}>
                <Feather name="lock" size={18} color={colors.text.muted} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder={t('codegen_password_placeholder')}
                  placeholderTextColor={colors.text.muted}
                  value={password}
                  onChangeText={setPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>
            <View style={styles.infoBox}>
              <Feather name="shield" size={14} color={colors.text.muted} />
              <Text style={styles.infoText}>{t('codegen_creds_info')}</Text>
            </View>
          </>
        )}

        {/* Code Preview */}
        <Text style={styles.sectionLabel}>{t('codegen_generated')}</Text>
        <View style={styles.platformBadge}>
          <Text style={styles.platformText}>
            {board.platform === 'arduino' ? 'Arduino / C++' : 'Python'}
          </Text>
        </View>
        <View style={styles.codeCard}>
          <ScrollView
            style={styles.codeScrollV}
            nestedScrollEnabled
            showsVerticalScrollIndicator={true}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={true}
              style={styles.codeScrollH}
            >
              <Text style={styles.codeText} selectable>{code}</Text>
            </ScrollView>
          </ScrollView>
        </View>

        {/* Copy Button */}
        <Pressable style={styles.copyButton} onPress={handleCopy}>
          <Feather
            name={copied ? 'check' : 'clipboard'}
            size={18}
            color={colors.white}
          />
          <Text style={styles.copyButtonText}>
            {copied ? t('codegen_copied') : t('codegen_copy')}
          </Text>
        </Pressable>

        {/* Instructions */}
        <View style={styles.stepsCard}>
          <Text style={styles.stepsTitle}>{t('codegen_next_steps')}</Text>
          {board.platform === 'arduino' ? (
            <>
              <StepItem number="1" text={t('codegen_step_arduino_1')} />
              <StepItem number="2" text={t('codegen_step_arduino_2')} />
              <StepItem number="3" text={t('codegen_step_arduino_3')(board.ideSetup)} />
              <StepItem number="4" text={t('codegen_step_arduino_4')} />
              <StepItem number="5" text={t('codegen_step_arduino_5')} />
            </>
          ) : boardId === 'rpi-pico-w' ? (
            <>
              <StepItem number="1" text={t('codegen_step_pico_1')} />
              <StepItem number="2" text={t('codegen_step_pico_2')} />
              <StepItem number="3" text={t('codegen_step_pico_3')} />
              <StepItem number="4" text={t('codegen_step_pico_4')} />
              <StepItem number="5" text={t('codegen_step_pico_5')} />
            </>
          ) : (
            <>
              <StepItem number="1" text={t('codegen_step_python_1')} />
              <StepItem number="2" text={t('codegen_step_python_2')} />
              <StepItem number="3" text={t('codegen_step_python_3')} />
              <StepItem number="4" text={t('codegen_step_python_4')} />
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StepItem({ number, text }: { number: string; text: string }) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepCircle}>
        <Text style={styles.stepNumber}>{number}</Text>
      </View>
      <Text style={styles.stepText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  headerTitle: {
    ...typography.headerTitle,
    color: colors.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  introText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    ...typography.sectionHeader,
    color: colors.text.muted,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  boardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: spacing.md,
  },
  boardButton: {
    width: '48%' as any,
    flexGrow: 1,
    flexBasis: '46%' as any,
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.bg.surface,
    borderRadius: borderRadius.innerCard,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  boardButtonActive: {
    borderColor: colors.accent.glow,
    backgroundColor: colors.bg.surfaceRaised,
  },
  boardName: {
    ...typography.bodySmall,
    color: colors.text.muted,
    fontWeight: '700',
    textAlign: 'center',
  },
  boardNameActive: {
    color: colors.accent.primary,
  },
  boardDesc: {
    ...typography.caption,
    color: colors.text.muted,
    textAlign: 'center',
    fontSize: 10,
  },
  platformBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.bg.surfaceLight,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: spacing.sm,
  },
  platformText: {
    fontFamily: 'Menlo',
    fontSize: 10,
    color: colors.accent.primary,
    fontWeight: '600',
  },
  inputCard: {
    backgroundColor: colors.bg.surface,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...neuShadow.flat,
    marginBottom: spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    ...typography.body,
    color: colors.text.primary,
    paddingVertical: 14,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.md + 30,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  infoText: {
    ...typography.caption,
    color: colors.text.muted,
    flex: 1,
    lineHeight: 18,
  },
  codeCard: {
    backgroundColor: colors.bg.input,
    borderRadius: borderRadius.innerCard,
    borderWidth: 1,
    borderColor: colors.border,
    height: 280,
    marginBottom: spacing.md,
  },
  codeScrollV: {
    flex: 1,
  },
  codeScrollH: {
    padding: spacing.md,
  },
  codeText: {
    ...typography.logText,
    color: colors.text.dim,
    lineHeight: 20,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent.primary,
    borderRadius: borderRadius.innerCard,
    paddingVertical: 14,
    marginBottom: spacing.lg,
    shadowColor: colors.accent.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  copyButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  stepsCard: {
    backgroundColor: colors.bg.surface,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...neuShadow.flat,
  },
  stepsTitle: {
    ...typography.titleSmall,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.bg.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumber: {
    ...typography.caption,
    color: colors.accent.primary,
    fontWeight: '700',
  },
  stepText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    flex: 1,
  },
});
