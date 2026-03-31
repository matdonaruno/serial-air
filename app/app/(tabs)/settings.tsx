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
import { t } from '../../src/i18n';
import { FREE_MODE } from '../../src/constants/defaults';
import { resetCoachMarks } from '../../src/components/CoachMark';

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
    securityMode,
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
      t('settings_reset'),
      t('settings_reset_confirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('settings_reset_button'),
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
        <Text style={styles.headerTitle}>{t('settings_title')}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* DISPLAY Section */}
        <Text style={styles.sectionHeader}>{t('settings_display')}</Text>
        <NeuCard style={styles.card}>
          <SettingRow label={t('settings_font_size')}>
            <ValueBadge value={`${fontSize}px`} onPress={handleCycleFontSize} />
          </SettingRow>

          <SettingRow label={t('settings_timestamp')}>
            <NeuToggle
              value={showTimestamp}
              onValueChange={(v) => updateSetting('showTimestamp', v)}
            />
          </SettingRow>

          <SettingRow label={t('settings_auto_scroll')}>
            <NeuToggle
              value={autoScroll}
              onValueChange={(v) => updateSetting('autoScroll', v)}
            />
          </SettingRow>

          <SettingRow label={t('settings_max_lines')}>
            <ValueBadge
              value={formatLines(maxLines)}
              onPress={handleCycleMaxLines}
            />
          </SettingRow>

          <SettingRow label={t('settings_theme')} isLast>
            <ValueBadge value={t('settings_theme_dark')} disabled />
          </SettingRow>
        </NeuCard>

        {/* CONNECTION Section */}
        <Text style={styles.sectionHeader}>{t('settings_connection')}</Text>
        <NeuCard style={styles.card}>
          <SettingRow label={t('settings_default_port')}>
            <Text style={styles.rowValue}>{defaultPort}</Text>
          </SettingRow>

          <SettingRow label={t('settings_auto_reconnect')}>
            <NeuToggle
              value={autoReconnect}
              onValueChange={(v) => updateSetting('autoReconnect', v)}
            />
          </SettingRow>

          <SettingRow label={t('settings_reconnect_interval')}>
            <ValueBadge
              value={formatMs(reconnectInterval)}
              onPress={handleCycleReconnectInterval}
            />
          </SettingRow>

          <SettingRow label={t('settings_timeout')}>
            <ValueBadge
              value={formatMs(connectionTimeout)}
              onPress={handleCycleTimeout}
            />
          </SettingRow>

          <LinkRow
            label={t('settings_trusted_devices')}
            icon="shield"
            onPress={() => router.push('/trusted-devices')}
            isLast
          />
        </NeuCard>

        {/* SECURITY Section */}
        <Text style={styles.sectionHeader}>{t('settings_security')}</Text>
        <NeuCard style={styles.card}>
          <SettingRow label={t('settings_security_mode')} isLast>
            <View style={styles.securityModes}>
              {(['none', 'pairing', 'password'] as const).map((mode) => (
                <Pressable
                  key={mode}
                  style={[styles.securityModeBtn, securityMode === mode && styles.securityModeBtnActive]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    updateSetting('securityMode', mode);
                  }}
                >
                  <Text style={[styles.securityModeText, securityMode === mode && styles.securityModeTextActive]}>
                    {mode === 'none' ? t('settings_security_none') : mode === 'pairing' ? t('settings_security_pairing') : t('settings_security_password')}
                  </Text>
                </Pressable>
              ))}
            </View>
          </SettingRow>
        </NeuCard>
        <Text style={styles.securityHint}>
          {securityMode === 'none'
            ? t('settings_security_hint_none')
            : securityMode === 'pairing'
            ? t('settings_security_hint_pairing')
            : t('settings_security_hint_password')}
        </Text>

        {/* PURCHASE Section (hidden in FREE_MODE) */}
        {!FREE_MODE && (
          <>
            <Text style={styles.sectionHeader}>{t('settings_purchase')}</Text>
            <NeuCard style={styles.card}>
              <SettingRow label={t('settings_status')}>
                <Text style={[styles.rowValue, isPurchased && { color: colors.status.connected }]}>
                  {isPurchased ? t('settings_pro_unlocked') : t('settings_trial_left')(trialDaysRemaining)}
                </Text>
              </SettingRow>

              {!isPurchased && (
                <LinkRow
                  label={t('settings_unlock_pro')}
                  icon="zap"
                  onPress={() => router.push('/paywall')}
                />
              )}

              <LinkRow
                label={t('settings_restore_purchase')}
                icon="refresh-cw"
                onPress={async () => {
                  const success = await restorePurchase();
                  if (success) {
                    Alert.alert(t('settings_restored'), t('settings_restored_msg'));
                  } else {
                    Alert.alert(t('settings_not_found'), t('settings_not_found_msg'));
                  }
                }}
                isLast
              />
            </NeuCard>
          </>
        )}

        {/* ABOUT Section */}
        <Text style={styles.sectionHeader}>{t('settings_about')}</Text>
        <NeuCard style={styles.card}>
          <SettingRow label={t('settings_version')}>
            <Text style={styles.rowValue}>{appVersion}</Text>
          </SettingRow>

          <LinkRow
            label={t('settings_arduino_library')}
            icon="external-link"
            onPress={handleOpenArduinoLibrary}
          />

          <LinkRow
            label={t('settings_github')}
            icon="external-link"
            onPress={handleOpenGitHub}
          />

          <LinkRow
            label={t('settings_rate_app')}
            icon="star"
            onPress={handleRateApp}
          />

          <LinkRow
            label={t('settings_privacy_policy')}
            icon="external-link"
            onPress={() => Linking.openURL('https://umemasait.com/serial-air/privacy.html')}
          />

          <LinkRow
            label={t('settings_terms')}
            icon="external-link"
            onPress={() => Linking.openURL('https://umemasait.com/serial-air/terms.html')}
            isLast
          />
        </NeuCard>

        {/* DANGER ZONE Section */}
        <Text style={styles.sectionHeader}>{t('settings_danger_zone')}</Text>
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
            {t('settings_reset')}
          </Text>
        </Pressable>

        {/* DEV Section (only in __DEV__) */}
        {__DEV__ && (
          <>
            <Text style={styles.sectionHeader}>{t('dev_title')}</Text>
            <NeuCard style={styles.card}>
              <LinkRow
                label={t('dev_replay_onboarding')}
                icon="play"
                onPress={() => {
                  useAppStore.getState().resetOnboarding();
                  router.replace('/onboarding' as any);
                }}
              />
              <LinkRow
                label={t('dev_replay_coach')}
                icon="message-circle"
                onPress={async () => {
                  await resetCoachMarks();
                  Alert.alert(t('ok'), t('dev_replay_coach_done'));
                }}
              />
              <LinkRow
                label={t('dev_reset_splash')}
                icon="zap"
                onPress={() => {
                  Alert.alert(t('dev_reset_splash'), t('dev_reset_splash_msg'));
                }}
                isLast
              />
            </NeuCard>
          </>
        )}

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
  securityModes: {
    flexDirection: 'row',
    gap: 6,
  },
  securityModeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.small,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg.surfaceLight,
  },
  securityModeBtnActive: {
    borderColor: colors.accent.glow,
    backgroundColor: colors.bg.surfaceRaised,
  },
  securityModeText: {
    ...typography.caption,
    color: colors.text.muted,
    fontWeight: '600',
  },
  securityModeTextActive: {
    color: colors.accent.primary,
  },
  securityHint: {
    ...typography.caption,
    color: colors.text.muted,
    marginTop: 8,
    marginHorizontal: spacing.xs,
    lineHeight: 18,
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
    height: 140,
  },
});
