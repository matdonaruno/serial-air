import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  Pressable,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

import { NeuCard, NeuButton } from '../src/components/neumorphic';
import { useTrustStore } from '../src/stores/useTrustStore';
import { TrustedDevice } from '../src/types';
import { t } from '../src/i18n';
import {
  colors,
  spacing,
  typography,
  borderRadius,
  layout,
} from '../src/constants/theme';

function formatDate(date: Date): string {
  const d = new Date(date);
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function TrustedDevicesScreen() {
  const router = useRouter();
  const trustedDevices = useTrustStore((s) => s.trustedDevices);
  const removeTrustedDevice = useTrustStore((s) => s.removeTrustedDevice);

  const handleRemove = useCallback(
    (device: TrustedDevice) => {
      Alert.alert(
        t('trusted_remove_title'),
        t('trusted_remove_msg')(device.name, device.deviceId),
        [
          { text: t('cancel'), style: 'cancel' },
          {
            text: t('trusted_remove_button'),
            style: 'destructive',
            onPress: () => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              removeTrustedDevice(device.deviceId);
            },
          },
        ],
      );
    },
    [removeTrustedDevice],
  );

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <NeuButton
          icon="arrow-left"
          onPress={() => router.back()}
          size={layout.actionButtonSize}
        />
        <Text style={styles.headerTitle}>{t('trusted_title')}</Text>
        <View style={{ width: layout.actionButtonSize }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {trustedDevices.length === 0 ? (
          <NeuCard style={styles.emptyCard}>
            <View style={styles.emptyContent}>
              <Feather name="shield" size={32} color={colors.text.muted} />
              <Text style={styles.emptyTitle}>{t('trusted_empty')}</Text>
              <Text style={styles.emptySubtext}>
                {t('trusted_empty_sub')}
              </Text>
            </View>
          </NeuCard>
        ) : (
          trustedDevices.map((device) => (
            <NeuCard key={device.deviceId} style={styles.deviceCard}>
              <View style={styles.deviceRow}>
                <View style={styles.iconCircle}>
                  <Feather
                    name={device.connectionType === 'ble' ? 'bluetooth' : 'wifi'}
                    size={20}
                    color={colors.accent.primary}
                  />
                </View>
                <View style={styles.deviceInfo}>
                  <Text style={styles.deviceName} numberOfLines={1}>
                    {device.name}
                  </Text>
                  <Text style={styles.deviceId}>{device.deviceId}</Text>
                  <Text style={styles.deviceDate}>
                    {t('trusted_date')(formatDate(device.trustedAt))}
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    handleRemove(device);
                  }}
                  hitSlop={12}
                >
                  <Feather name="trash-2" size={18} color={colors.danger} />
                </Pressable>
              </View>
            </NeuCard>
          ))
        )}

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPaddingH,
    height: layout.headerHeight,
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
    paddingTop: spacing.md,
  },
  emptyCard: {
    marginTop: spacing.xl,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyTitle: {
    ...typography.body,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  emptySubtext: {
    ...typography.caption,
    color: colors.text.muted,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  deviceCard: {
    marginBottom: spacing.md,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bg.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
  },
  deviceId: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  deviceDate: {
    ...typography.caption,
    color: colors.text.muted,
    marginTop: 2,
  },
  bottomSpacer: {
    height: spacing.xxl,
  },
});
