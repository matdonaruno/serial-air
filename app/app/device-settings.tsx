import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { NeuCard, NeuInput, NeuButton, NeuToggle } from '../src/components/neumorphic';
import {
  colors,
  spacing,
  borderRadius,
  typography,
  neuShadow,
} from '../src/constants/theme';

export default function DeviceSettingsScreen() {
  const [ssid, setSsid] = useState('Serial_Air_One');
  const [password, setPassword] = useState('password123');
  const [staticIp, setStaticIp] = useState('192.168.1.142');
  const [baudRate, setBaudRate] = useState('115200');
  const [showPassword, setShowPassword] = useState(false);
  const [autoReconnect, setAutoReconnect] = useState(true);
  const [enableLogging, setEnableLogging] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  const handleReset = () => {
    Alert.alert(
      'Reset to Factory Defaults',
      'This will erase all device configuration. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setSsid('');
            setPassword('');
            setStaticIp('');
            setBaudRate('115200');
          },
        },
      ]
    );
  };

  const handleSave = () => {
    Alert.alert('Saved', 'Device settings have been saved.');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <NeuButton icon="arrow-left" onPress={() => router.back()} size={40} />
        <Text style={styles.headerTitle}>DEVICE SETTINGS</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* CONNECTION */}
        <Text style={styles.sectionTitle}>CONNECTION</Text>
        <NeuCard style={styles.card}>
          <NeuInput
            label="SSID Name"
            icon="wifi"
            value={ssid}
            onChangeText={setSsid}
            placeholder="Enter WiFi SSID"
          />
          <View style={styles.spacer} />
          <View>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.passwordRow}>
              <NeuInput
                icon="lock"
                value={password}
                onChangeText={setPassword}
                placeholder="Enter password"
                secureTextEntry={!showPassword}
                containerStyle={{ flex: 1 }}
              />
              <Pressable
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Feather
                  name={showPassword ? 'eye' : 'eye-off'}
                  size={20}
                  color={colors.text.muted}
                />
              </Pressable>
            </View>
          </View>
          <View style={styles.spacer} />
          <NeuInput
            label="Static IP"
            icon="monitor"
            value={staticIp}
            onChangeText={setStaticIp}
            placeholder="e.g. 192.168.1.100"
            keyboardType="decimal-pad"
          />
          <View style={styles.spacer} />
          <View>
            <Text style={styles.inputLabel}>Baud Rate</Text>
            <Pressable
              style={styles.baudRateSelector}
              onPress={() => {
                const rates = ['9600', '19200', '38400', '57600', '115200'];
                const idx = rates.indexOf(baudRate);
                const next = rates[(idx + 1) % rates.length];
                setBaudRate(next);
              }}
            >
              <Feather
                name="activity"
                size={20}
                color={colors.text.muted}
                style={{ marginRight: spacing.sm }}
              />
              <Text style={styles.baudRateText}>{baudRate}</Text>
              <Feather name="chevron-down" size={18} color={colors.text.muted} />
            </Pressable>
          </View>
        </NeuCard>

        {/* FEATURES */}
        <Text style={styles.sectionTitle}>FEATURES</Text>

        <NeuCard
          style={styles.featureCard}
        >
          <View style={styles.featureRow}>
            <View style={styles.featureIconContainer}>
              <Feather name="refresh-cw" size={18} color={colors.accent.primary} />
            </View>
            <Text style={styles.featureLabel}>Auto-reconnect</Text>
            <NeuToggle value={autoReconnect} onValueChange={setAutoReconnect} />
          </View>
        </NeuCard>

        <NeuCard style={styles.featureCard}>
          <View style={styles.featureRow}>
            <View style={styles.featureIconContainer}>
              <Feather name="file-text" size={18} color={colors.text.muted} />
            </View>
            <Text style={styles.featureLabel}>Enable Logging</Text>
            <NeuToggle value={enableLogging} onValueChange={setEnableLogging} />
          </View>
        </NeuCard>

        <NeuCard style={styles.featureCard}>
          <View style={styles.featureRow}>
            <View style={styles.featureIconContainer}>
              <Feather name="moon" size={18} color={colors.accent.primary} />
            </View>
            <Text style={styles.featureLabel}>Dark Mode Override</Text>
            <NeuToggle value={darkMode} onValueChange={setDarkMode} />
          </View>
        </NeuCard>

        {/* DANGER ZONE */}
        <Text style={[styles.sectionTitle, { color: colors.danger }]}>
          DANGER ZONE
        </Text>
        <Pressable onPress={handleReset}>
          <NeuCard style={styles.dangerCard}>
            <View style={styles.dangerRow}>
              <Feather name="rotate-ccw" size={18} color={colors.danger} />
              <Text style={styles.dangerText}>Reset to Factory Defaults</Text>
            </View>
          </NeuCard>
        </Pressable>

        {/* SAVE BUTTON */}
        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>SAVE CHANGES</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
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
  headerTitle: {
    ...typography.headerTitle,
    color: colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 40,
  },
  sectionTitle: {
    ...typography.sectionHeader,
    color: colors.text.muted,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },
  card: {
    padding: spacing.lg,
    gap: 0,
  },
  spacer: {
    height: spacing.lg,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 14,
    padding: 4,
  },
  baudRateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.input,
    borderRadius: borderRadius.innerCard,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.shadow.innerDark,
  },
  baudRateText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.primary,
  },
  featureCard: {
    marginBottom: spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bg.debossed,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  featureLabel: {
    ...typography.body,
    color: colors.text.primary,
    flex: 1,
  },
  dangerCard: {
    borderColor: 'rgba(248, 113, 113, 0.15)',
  },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  dangerText: {
    ...typography.body,
    color: colors.danger,
    fontWeight: '600',
  },
  saveButton: {
    marginTop: spacing.xl,
    backgroundColor: colors.bg.surface,
    borderRadius: borderRadius.innerCard,
    paddingVertical: 16,
    alignItems: 'center',
    ...neuShadow.flat,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  saveButtonText: {
    ...typography.headerTitle,
    color: colors.accent.primary,
    fontSize: 14,
  },
});
