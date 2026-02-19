import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Pressable,
  Alert,
  Linking,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as StoreReview from 'expo-store-review';
import * as Haptics from 'expo-haptics';
import { NeuCard } from '../../src/components/neumorphic/NeuCard';
import { NeuToggle } from '../../src/components/neumorphic/NeuToggle';
import { useRouter } from 'expo-router';
import { useSettingsStore } from '../../src/stores/useSettingsStore';
import { useAppStore } from '../../src/stores/useAppStore';
import { usePurchaseStore } from '../../src/stores/usePurchaseStore';
import {
  colors,
  typography,
  spacing,
  borderRadius,
  layout,
} from '../../src/constants/theme';

// --- Cycle helpers ---

const FONT_SIZE_OPTIONS = [12, 14, 16, 18] as const;
const MAX_LINES_OPTIONS = [1000, 5000, 10000, 50000] as const;
const RECONNECT_INTERVAL_OPTIONS = [3000, 5000, 10000, 15000] as const;
const TIMEOUT_OPTIONS = [5000, 10000, 15000, 30000] as const;

function cycleValue<T>(current: T, options: readonly T[]): T {
  const idx = options.indexOf(current as any);
  return options[(idx + 1) % options.length];
}

function formatMs(ms: number): string {
  return ms >= 1000 ? `${ms / 1000}s` : `${ms}ms`;
}

function formatLines(n: number): string {
  return n >= 1000 ? `${n / 1000}K` : String(n);
}

// --- Row components ---

function SettingRow({
  label,
  children,
  isLast = false,
}: {
  label: string;
  children: React.ReactNode;
  isLast?: boolean;
}) {
  return (
    <>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>{label}</Text>
        {children}
      </View>
      {!isLast && <View style={styles.divider} />}
    </>
  );
}

function ValueBadge({
  value,
  onPress,
  disabled,
}: {
  value: string;
  onPress?: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
      }}
      disabled={disabled}
      style={({ pressed }) => [
        styles.valueBadge,
        pressed && !disabled && styles.valueBadgePressed,
        disabled && styles.valueBadgeDisabled,
      ]}
    >
      <Text
        style={[
          styles.valueBadgeText,
          disabled && styles.valueBadgeTextDisabled,
        ]}
      >
        {value}
      </Text>
    </Pressable>
  );
}

function LinkRow({
  label,
  icon,
  onPress,
  isLast = false,
}: {
  label: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  onPress: () => void;
  isLast?: boolean;
}) {
  return (
    <>
      <Pressable style={styles.row} onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Feather name={icon} size={18} color={colors.text.muted} />
      </Pressable>
      {!isLast && <View style={styles.divider} />}
    </>
  );
}

// --- Main screen ---

export default function SettingsScreen() {
  const router = useRouter();
  const isPurchased = usePurchaseStore((s) => s.isPurchased);
  const trialDaysRemaining = usePurchaseStore((s) => s.trialDaysRemaining);
  const restorePurchase = usePurchaseStore((s) => s.restore);

  const {
    fontSize,
    showTimestamp,
    autoScroll,
    maxLines,
    colorTheme,
    defaultPort,
    autoReconnect,
    reconnectInterval,
    connectionTimeout,
    updateSetting,
    resetSettings,
  } = useSettingsStore();

  const appVersion = useAppStore((s) => s.appVersion);

  const handleCycleFontSize = useCallback(() => {
    updateSetting('fontSize', cycleValue(fontSize, FONT_SIZE_OPTIONS));
  }, [fontSize, updateSetting]);

  const handleCycleMaxLines = useCallback(() => {
    updateSetting('maxLines', cycleValue(maxLines, MAX_LINES_OPTIONS));
  }, [maxLines, updateSetting]);

  const handleCycleReconnectInterval = useCallback(() => {
    updateSetting(
      'reconnectInterval',
      cycleValue(reconnectInterval, RECONNECT_INTERVAL_OPTIONS)
    );
  }, [reconnectInterval, updateSetting]);

  const handleCycleTimeout = useCallback(() => {
    updateSetting(
      'connectionTimeout',
      cycleValue(connectionTimeout, TIMEOUT_OPTIONS)
    );
  }, [connectionTimeout, updateSetting]);

  const handleResetDefaults = useCallback(() => {
    Alert.alert(
      'Reset to Factory Defaults',
      'This will reset all settings to their default values. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: resetSettings,
        },
      ]
    );
  }, [resetSettings]);

  const handleOpenArduinoLibrary = useCallback(() => {
    Linking.openURL(
      'https://github.com/matdonaruno/serial-air/tree/main/arduino/WirelessSerial'
    );
  }, []);

  const handleOpenGitHub = useCallback(() => {
    Linking.openURL('https://github.com/matdonaruno/serial-air');
  }, []);

  const handleRateApp = useCallback(async () => {
    try {
      if (await StoreReview.hasAction()) {
        await StoreReview.requestReview();
      }
    } catch {
      // Silently fail if review not available
    }
  }, []);

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SETTINGS</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* DISPLAY Section */}
        <Text style={styles.sectionHeader}>DISPLAY</Text>
        <NeuCard style={styles.card}>
          <SettingRow label="Font Size">
            <ValueBadge value={`${fontSize}px`} onPress={handleCycleFontSize} />
          </SettingRow>

          <SettingRow label="Timestamp">
            <NeuToggle
              value={showTimestamp}
              onValueChange={(v) => updateSetting('showTimestamp', v)}
            />
          </SettingRow>

          <SettingRow label="Auto-scroll">
            <NeuToggle
              value={autoScroll}
              onValueChange={(v) => updateSetting('autoScroll', v)}
            />
          </SettingRow>

          <SettingRow label="Max Lines">
            <ValueBadge
              value={formatLines(maxLines)}
              onPress={handleCycleMaxLines}
            />
          </SettingRow>

          <SettingRow label="Theme" isLast>
            <ValueBadge value="Dark" disabled />
          </SettingRow>
        </NeuCard>

        {/* CONNECTION Section */}
        <Text style={styles.sectionHeader}>CONNECTION</Text>
        <NeuCard style={styles.card}>
          <SettingRow label="Default Port">
            <Text style={styles.rowValue}>{defaultPort}</Text>
          </SettingRow>

          <SettingRow label="Auto-reconnect">
            <NeuToggle
              value={autoReconnect}
              onValueChange={(v) => updateSetting('autoReconnect', v)}
            />
          </SettingRow>

          <SettingRow label="Reconnect Interval">
            <ValueBadge
              value={formatMs(reconnectInterval)}
              onPress={handleCycleReconnectInterval}
            />
          </SettingRow>

          <SettingRow label="Timeout" isLast>
            <ValueBadge
              value={formatMs(connectionTimeout)}
              onPress={handleCycleTimeout}
            />
          </SettingRow>
        </NeuCard>

        {/* PURCHASE Section */}
        <Text style={styles.sectionHeader}>PURCHASE</Text>
        <NeuCard style={styles.card}>
          <SettingRow label="Status">
            <Text style={[styles.rowValue, isPurchased && { color: colors.status.connected }]}>
              {isPurchased ? 'Pro (Unlocked)' : `Trial (${trialDaysRemaining}d left)`}
            </Text>
          </SettingRow>

          {!isPurchased && (
            <LinkRow
              label="Unlock Pro — $1.99"
              icon="zap"
              onPress={() => router.push('/paywall')}
            />
          )}

          <LinkRow
            label="Restore Purchase"
            icon="refresh-cw"
            onPress={async () => {
              const success = await restorePurchase();
              if (success) {
                Alert.alert('Restored', 'Your purchase has been restored.');
              } else {
                Alert.alert('Not Found', 'No previous purchase was found.');
              }
            }}
            isLast
          />
        </NeuCard>

        {/* ABOUT Section */}
        <Text style={styles.sectionHeader}>ABOUT</Text>
        <NeuCard style={styles.card}>
          <SettingRow label="Version">
            <Text style={styles.rowValue}>{appVersion}</Text>
          </SettingRow>

          <LinkRow
            label="Arduino Library"
            icon="external-link"
            onPress={handleOpenArduinoLibrary}
          />

          <LinkRow
            label="GitHub"
            icon="external-link"
            onPress={handleOpenGitHub}
          />

          <LinkRow
            label="Rate this app"
            icon="star"
            onPress={handleRateApp}
          />

          <LinkRow
            label="Privacy Policy"
            icon="external-link"
            onPress={() => Linking.openURL('https://serialair.netlify.app/privacy')}
          />

          <LinkRow
            label="Terms of Service"
            icon="external-link"
            onPress={() => Linking.openURL('https://serialair.netlify.app/terms')}
            isLast
          />
        </NeuCard>

        {/* DANGER ZONE Section */}
        <Text style={styles.sectionHeader}>DANGER ZONE</Text>
        <Pressable
          style={({ pressed }) => [
            styles.dangerButton,
            pressed && styles.dangerButtonPressed,
          ]}
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            handleResetDefaults();
          }}
        >
          <Feather
            name="alert-triangle"
            size={16}
            color={colors.danger}
            style={styles.dangerIcon}
          />
          <Text style={styles.dangerButtonText}>
            Reset to Factory Defaults
          </Text>
        </Pressable>

        {/* Bottom spacer for tab bar */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  header: {
    height: layout.headerHeight,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: layout.screenPaddingH,
  },
  headerTitle: {
    ...typography.headerTitle,
    color: colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPaddingH,
  },
  sectionHeader: {
    ...typography.sectionHeader,
    color: colors.text.muted,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },
  card: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  rowLabel: {
    ...typography.body,
    color: colors.text.primary,
    flex: 1,
  },
  rowValue: {
    ...typography.body,
    color: colors.text.secondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.bg.surfaceLight,
  },
  valueBadge: {
    backgroundColor: colors.bg.surfaceLight,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: borderRadius.small,
    borderWidth: 1,
    borderColor: colors.border,
  },
  valueBadgePressed: {
    backgroundColor: colors.bg.surfaceRaised,
  },
  valueBadgeDisabled: {
    opacity: 0.5,
  },
  valueBadgeText: {
    ...typography.bodySmall,
    color: colors.accent.primary,
    fontWeight: '600',
  },
  valueBadgeTextDisabled: {
    color: colors.text.muted,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.surface,
    borderRadius: borderRadius.card,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.15)',
  },
  dangerButtonPressed: {
    backgroundColor: colors.bg.surfaceLight,
  },
  dangerIcon: {
    marginRight: spacing.sm,
  },
  dangerButtonText: {
    ...typography.body,
    color: colors.danger,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: spacing.xxl,
  },
});
