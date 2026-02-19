import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '../src/stores/useSettingsStore';
import { COLORS } from '../src/constants/defaults';

function SettingRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const colors = COLORS.dark;
  return (
    <View style={[styles.row, { borderColor: colors.border }]}>
      <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
      {children}
    </View>
  );
}

function SettingToggle({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  const colors = COLORS.dark;
  return (
    <SettingRow label={label}>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.primary }}
      />
    </SettingRow>
  );
}

function SettingValue({ label, value }: { label: string; value: string }) {
  const colors = COLORS.dark;
  return (
    <SettingRow label={label}>
      <Text style={[styles.rowValue, { color: colors.textSecondary }]}>
        {value}
      </Text>
    </SettingRow>
  );
}

function SettingLink({
  label,
  url,
}: {
  label: string;
  url: string;
}) {
  const colors = COLORS.dark;
  return (
    <TouchableOpacity
      style={[styles.row, { borderColor: colors.border }]}
      onPress={() => Linking.openURL(url)}
    >
      <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
      <Ionicons name="open-outline" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

function SectionHeader({ title }: { title: string }) {
  const colors = COLORS.dark;
  return (
    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
      {title}
    </Text>
  );
}

export default function SettingsScreen() {
  const colors = COLORS.dark;
  const settings = useSettingsStore();

  const fontSizeOptions = [12, 14, 16, 18];
  const maxLinesOptions = [1000, 5000, 10000, 50000];
  const reconnectOptions = [3, 5, 10, 15];
  const timeoutOptions = [5, 10, 15, 30];

  const cycleFontSize = () => {
    const idx = fontSizeOptions.indexOf(settings.fontSize);
    const next = fontSizeOptions[(idx + 1) % fontSizeOptions.length];
    settings.updateSetting('fontSize', next);
  };

  const cycleMaxLines = () => {
    const idx = maxLinesOptions.indexOf(settings.maxLines);
    const next = maxLinesOptions[(idx + 1) % maxLinesOptions.length];
    settings.updateSetting('maxLines', next);
  };

  const cycleReconnect = () => {
    const current = settings.reconnectInterval / 1000;
    const idx = reconnectOptions.indexOf(current);
    const next =
      reconnectOptions[(idx + 1) % reconnectOptions.length] * 1000;
    settings.updateSetting('reconnectInterval', next);
  };

  const cycleTimeout = () => {
    const current = settings.connectionTimeout / 1000;
    const idx = timeoutOptions.indexOf(current);
    const next =
      timeoutOptions[(idx + 1) % timeoutOptions.length] * 1000;
    settings.updateSetting('connectionTimeout', next);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Display */}
      <SectionHeader title="Display" />
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity onPress={cycleFontSize}>
          <SettingValue label="Font Size" value={`${settings.fontSize}pt`} />
        </TouchableOpacity>
        <SettingToggle
          label="Timestamp"
          value={settings.showTimestamp}
          onValueChange={(v) => settings.updateSetting('showTimestamp', v)}
        />
        <SettingToggle
          label="Auto-scroll"
          value={settings.autoScroll}
          onValueChange={(v) => settings.updateSetting('autoScroll', v)}
        />
        <TouchableOpacity onPress={cycleMaxLines}>
          <SettingValue
            label="Max Lines"
            value={settings.maxLines.toLocaleString()}
          />
        </TouchableOpacity>
      </View>

      {/* Connection */}
      <SectionHeader title="Connection" />
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <SettingValue
          label="Default Port"
          value={String(settings.defaultPort)}
        />
        <SettingToggle
          label="Auto-reconnect"
          value={settings.autoReconnect}
          onValueChange={(v) => settings.updateSetting('autoReconnect', v)}
        />
        <TouchableOpacity onPress={cycleReconnect}>
          <SettingValue
            label="Reconnect Interval"
            value={`${settings.reconnectInterval / 1000}s`}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={cycleTimeout}>
          <SettingValue
            label="Connection Timeout"
            value={`${settings.connectionTimeout / 1000}s`}
          />
        </TouchableOpacity>
      </View>

      {/* Log */}
      <SectionHeader title="Log" />
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <SettingToggle
          label="Auto-save"
          value={settings.autoSave}
          onValueChange={(v) => settings.updateSetting('autoSave', v)}
        />
        <SettingValue
          label="Max File Size"
          value={`${settings.maxFileSize / (1024 * 1024)}MB`}
        />
      </View>

      {/* About */}
      <SectionHeader title="About" />
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <SettingValue label="Version" value="1.0.0" />
        <SettingLink
          label="Arduino Library"
          url="https://github.com/matdonaruno/serial-air/tree/main/arduino/WirelessSerial"
        />
        <SettingLink
          label="GitHub"
          url="https://github.com/matdonaruno/serial-air"
        />
      </View>

      {/* Reset */}
      <TouchableOpacity
        style={[styles.resetButton, { borderColor: colors.error }]}
        onPress={settings.resetSettings}
      >
        <Text style={[styles.resetText, { color: colors.error }]}>
          Reset to Defaults
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 4,
  },
  section: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLabel: {
    fontSize: 16,
  },
  rowValue: {
    fontSize: 16,
  },
  resetButton: {
    marginTop: 32,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  resetText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
