import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { NeuCard, NeuButton, NeuInput } from '../../src/components/neumorphic';
import { useConnectionStore } from '../../src/stores/useConnectionStore';
import { useDiscoveryStore } from '../../src/stores/useDiscoveryStore';
import { useSettingsStore } from '../../src/stores/useSettingsStore';
import { usePurchaseStore } from '../../src/stores/usePurchaseStore';
import { DeviceDiscovery } from '../../src/services/DeviceDiscovery';
import { Device, RecentConnection } from '../../src/types';
import {
  colors,
  spacing,
  typography,
  layout,
  borderRadius,
  neuShadow,
} from '../../src/constants/theme';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return 'Yesterday';
  return `${diffDay}d ago`;
}

// ---------------------------------------------------------------------------
// Home Screen
// ---------------------------------------------------------------------------

export default function HomeScreen() {
  const router = useRouter();

  // Stores
  const connect = useConnectionStore((s) => s.connect);
  const devices = useDiscoveryStore((s) => s.devices);
  const addDevice = useDiscoveryStore((s) => s.addDevice);
  const removeDevice = useDiscoveryStore((s) => s.removeDevice);
  const recentConnections = useDiscoveryStore((s) => s.recentConnections);
  const addRecentConnection = useDiscoveryStore((s) => s.addRecentConnection);
  const loadRecentConnections = useDiscoveryStore((s) => s.loadRecentConnections);
  const defaultPort = useSettingsStore((s) => s.defaultPort);
  const hasAccess = usePurchaseStore((s) => s.hasAccess);
  const isPurchased = usePurchaseStore((s) => s.isPurchased);
  const trialDaysRemaining = usePurchaseStore((s) => s.trialDaysRemaining);

  // Manual connection state
  const [manualIp, setManualIp] = useState('');
  const [manualPort, setManualPort] = useState('');

  // Discovery ref
  const discoveryRef = useRef<DeviceDiscovery | null>(null);

  // -------------------------------------------------------------------
  // Discovery lifecycle
  // -------------------------------------------------------------------

  useEffect(() => {
    loadRecentConnections();

    const discovery = new DeviceDiscovery(
      (device: Device) => addDevice(device),
      (name: string) => removeDevice(name),
    );
    discoveryRef.current = discovery;
    discovery.startScan();

    return () => {
      discovery.destroy();
      discoveryRef.current = null;
    };
  }, []);

  // -------------------------------------------------------------------
  // Connect helpers
  // -------------------------------------------------------------------

  const connectToDevice = useCallback(
    (host: string, port: number, deviceName?: string) => {
      if (!hasAccess) {
        router.push('/paywall');
        return;
      }
      connect(host, port, deviceName);
      addRecentConnection({
        host,
        port,
        deviceName,
        lastConnected: new Date(),
      });
      router.push('/monitor');
    },
    [connect, addRecentConnection, router, hasAccess],
  );

  const handleManualConnect = useCallback(() => {
    const ip = manualIp.trim();
    if (!ip) return;
    const port = manualPort.trim() ? parseInt(manualPort.trim(), 10) : defaultPort;
    if (isNaN(port)) return;
    connectToDevice(ip, port);
  }, [manualIp, manualPort, defaultPort, connectToDevice]);

  // -------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ---- Header ---- */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>SERIAL AIR</Text>
          <NeuButton
            icon="settings"
            onPress={() => router.push('/(tabs)/settings')}
            size={layout.actionButtonSize}
          />
        </View>

        {/* ---- Trial Banner ---- */}
        {!isPurchased && (
          <Pressable
            style={[
              styles.trialBanner,
              trialDaysRemaining <= 0 && styles.trialBannerExpired,
            ]}
            onPress={() => router.push('/paywall')}
          >
            <Feather
              name={trialDaysRemaining > 0 ? 'clock' : 'alert-circle'}
              size={16}
              color={trialDaysRemaining > 0 ? colors.accent.primary : colors.status.disconnected}
            />
            <Text
              style={[
                styles.trialBannerText,
                trialDaysRemaining <= 0 && styles.trialBannerTextExpired,
              ]}
            >
              {trialDaysRemaining > 0
                ? `Free trial: ${trialDaysRemaining} day${trialDaysRemaining !== 1 ? 's' : ''} remaining`
                : 'Trial expired — Tap to unlock'}
            </Text>
            <Feather name="chevron-right" size={16} color={colors.text.muted} />
          </Pressable>
        )}

        {/* ---- Quick Start ---- */}
        <Pressable
          style={styles.codeGenButton}
          onPress={() => router.push('/code-generator')}
        >
          <View style={styles.codeGenIcon}>
            <Feather name="code" size={18} color={colors.accent.primary} />
          </View>
          <View style={styles.codeGenText}>
            <Text style={styles.codeGenTitle}>Generate Test Code</Text>
            <Text style={styles.codeGenSub}>Get a ready-to-upload Arduino sketch</Text>
          </View>
          <Feather name="chevron-right" size={18} color={colors.text.muted} />
        </Pressable>

        {/* ---- Discovered ---- */}
        <Text style={styles.sectionHeader}>DISCOVERED</Text>

        {devices.map((device) => {
          const isOnline = device.isOnline;
          return (
            <NeuCard
              key={device.name}
              style={styles.deviceCard}
              onPress={() =>
                isOnline
                  ? connectToDevice(device.host, device.port, device.name)
                  : undefined
              }
              accentBorder={isOnline}
              disabled={!isOnline}
            >
              <View style={styles.deviceRow}>
                {/* Icon circle */}
                <View
                  style={[
                    styles.deviceIconCircle,
                    isOnline && styles.deviceIconCircleActive,
                  ]}
                >
                  <Feather
                    name="cpu"
                    size={24}
                    color={
                      isOnline ? colors.accent.primary : colors.text.muted
                    }
                  />
                </View>

                {/* Name / status */}
                <View style={styles.deviceInfo}>
                  <Text
                    style={[
                      styles.deviceName,
                      !isOnline && styles.deviceNameOffline,
                    ]}
                    numberOfLines={1}
                  >
                    {device.name}
                  </Text>
                  <View style={styles.deviceStatusRow}>
                    <View
                      style={[
                        styles.statusDot,
                        {
                          backgroundColor: isOnline
                            ? colors.status.connected
                            : colors.status.offline,
                        },
                        isOnline && styles.statusDotGlow,
                      ]}
                    />
                    <Text style={styles.deviceAddress}>
                      {isOnline
                        ? device.host
                        : `Offline \u2022 ${timeAgo(device.lastSeen)}`}
                    </Text>
                  </View>
                </View>
              </View>
            </NeuCard>
          );
        })}

        {devices.length === 0 && (
          <NeuCard style={styles.emptyCard}>
            <View style={styles.emptyContent}>
              <Feather name="search" size={24} color={colors.text.muted} />
              <Text style={styles.emptyText}>Scanning for devices...</Text>
            </View>
          </NeuCard>
        )}

        {/* ---- Manual Connection ---- */}
        <Text style={styles.sectionHeader}>MANUAL CONNECTION</Text>

        <NeuCard style={styles.manualCard}>
          <NeuInput
            icon="globe"
            placeholder="IP Address (e.g. 192.168.4.1)"
            value={manualIp}
            onChangeText={setManualIp}
            keyboardType="numeric"
            autoCapitalize="none"
            autoCorrect={false}
            containerStyle={styles.inputContainer}
          />
          <NeuInput
            icon="hash"
            placeholder={`Port (e.g. ${defaultPort})`}
            value={manualPort}
            onChangeText={setManualPort}
            keyboardType="number-pad"
            containerStyle={styles.inputContainer}
          />
        </NeuCard>

        {/* Connect button — positioned centered below the card */}
        <View style={styles.connectButtonWrapper}>
          <NeuButton
            icon="wifi"
            onPress={handleManualConnect}
            size={layout.connectButtonSize}
            variant="accent"
          />
        </View>

        {/* ---- Recent ---- */}
        {recentConnections.length > 0 && (
          <>
            <Text style={styles.sectionHeader}>RECENT</Text>

            {recentConnections.map((recent: RecentConnection, index: number) => (
              <Pressable
                key={`${recent.host}:${recent.port}-${index}`}
                style={styles.recentItem}
                onPress={() =>
                  connectToDevice(
                    recent.host,
                    recent.port,
                    recent.deviceName,
                  )
                }
              >
                <Feather
                  name="clock"
                  size={18}
                  color={colors.text.muted}
                  style={styles.recentIcon}
                />
                <Text style={styles.recentAddress} numberOfLines={1}>
                  {recent.host}:{recent.port}
                </Text>
                <Text style={styles.recentTime}>
                  {timeAgo(recent.lastConnected)}
                </Text>
              </Pressable>
            ))}
          </>
        )}

        {/* Bottom spacing so content isn't hidden behind tab bar */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPaddingH,
    paddingTop: layout.screenPaddingV,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    position: 'relative',
  },
  headerTitle: {
    ...typography.headerTitle,
    color: colors.text.primary,
  },
  // Settings button positioned absolutely on the right
  settingsBtn: {
    position: 'absolute',
    right: 0,
  },

  // Section headers
  sectionHeader: {
    ...typography.sectionHeader,
    color: colors.text.muted,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },

  // Device cards
  deviceCard: {
    marginBottom: spacing.md,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceIconCircle: {
    width: layout.deviceIconSize,
    height: layout.deviceIconSize,
    borderRadius: layout.deviceIconSize / 2,
    backgroundColor: colors.bg.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    ...neuShadow.icon,
  },
  deviceIconCircleActive: {
    backgroundColor: colors.bg.surfaceLight,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    ...typography.deviceName,
    color: colors.text.primary,
    marginBottom: 4,
  },
  deviceNameOffline: {
    color: colors.text.muted,
  },
  deviceStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  statusDotGlow: {
    shadowColor: colors.status.connected,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 4,
  },
  deviceAddress: {
    ...typography.caption,
    color: colors.text.secondary,
  },

  // Empty state
  emptyCard: {
    marginBottom: spacing.md,
  },
  emptyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  emptyText: {
    ...typography.bodySmall,
    color: colors.text.muted,
  },

  // Manual connection
  manualCard: {
    gap: spacing.md,
  },
  inputContainer: {
    // spacing handled by NeuCard gap
  },
  connectButtonWrapper: {
    alignItems: 'center',
    marginTop: -spacing.xl,
    marginBottom: spacing.sm,
    zIndex: 1,
  },

  // Recent connections
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  recentIcon: {
    marginRight: spacing.md,
  },
  recentAddress: {
    ...typography.body,
    color: colors.text.primary,
    flex: 1,
  },
  recentTime: {
    ...typography.caption,
    color: colors.text.muted,
  },

  // Trial banner
  trialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.surface,
    borderRadius: borderRadius.innerCard,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.accent.glow,
    gap: 8,
  },
  trialBannerExpired: {
    borderColor: 'rgba(248, 113, 113, 0.3)',
  },
  trialBannerText: {
    ...typography.bodySmall,
    color: colors.accent.primary,
    flex: 1,
    fontWeight: '600',
  },
  trialBannerTextExpired: {
    color: colors.status.disconnected,
  },

  // Code generator
  codeGenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.surface,
    borderRadius: borderRadius.innerCard,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 12,
  },
  codeGenIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bg.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeGenText: {
    flex: 1,
  },
  codeGenTitle: {
    ...typography.bodySmall,
    color: colors.text.primary,
    fontWeight: '600',
  },
  codeGenSub: {
    ...typography.caption,
    color: colors.text.muted,
    marginTop: 1,
  },

  // Bottom spacer
  bottomSpacer: {
    height: spacing.xxl,
  },
});
