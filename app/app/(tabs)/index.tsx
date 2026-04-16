import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Platform,
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
  Switch,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';

import { NeuCard, NeuButton, NeuInput } from '../../src/components/neumorphic';
import { useConnectionStore, getBleManager } from '../../src/stores/useConnectionStore';
import { useDiscoveryStore } from '../../src/stores/useDiscoveryStore';
import { useSettingsStore } from '../../src/stores/useSettingsStore';
import { getEffectiveFreeMode } from '../../src/constants/defaults';
import { usePurchaseStore } from '../../src/stores/usePurchaseStore';
import { useTrustStore } from '../../src/stores/useTrustStore';
import { DeviceDiscovery } from '../../src/services/DeviceDiscovery';
import { BleDiscovery } from '../../src/services/BleDiscovery';
import { Device, RecentConnection } from '../../src/types';
import { t } from '../../src/i18n';
import { CoachMark } from '../../src/components/CoachMark';
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
  if (diffMin < 1) return t('home_time_just_now');
  if (diffMin < 60) return t('home_time_min')(diffMin);
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return t('home_time_hour')(diffHr);
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return t('home_time_yesterday');
  return t('home_time_day')(diffDay);
}

function formatUptime(connectedAt: Date | null): string {
  if (!connectedAt) return '';
  const diffMs = new Date().getTime() - new Date(connectedAt).getTime();
  const secs = Math.floor(diffMs / 1000);
  const mins = Math.floor(secs / 60);
  const hrs = Math.floor(mins / 60);
  if (hrs > 0) return `${hrs}h ${mins % 60}m`;
  if (mins > 0) return `${mins}m ${secs % 60}s`;
  return `${secs}s`;
}

// ---------------------------------------------------------------------------
// Connection Status Banner
// ---------------------------------------------------------------------------

function ConnectionBanner() {
  const status = useConnectionStore((s) => s.status);
  const currentDevice = useConnectionStore((s) => s.currentDevice);
  const connectedAt = useConnectionStore((s) => s.connectedAt);
  const connectionType = useConnectionStore((s) => s.connectionType);
  const [uptimeStr, setUptimeStr] = useState('');

  // Pulsing dot for connected state
  const opacity = useSharedValue(1);
  useEffect(() => {
    if (status === 'connected') {
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );
    } else {
      opacity.value = 1;
    }
  }, [status]);

  const dotStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  // Uptime counter
  useEffect(() => {
    if (status !== 'connected' || !connectedAt) {
      setUptimeStr('');
      return;
    }
    const interval = setInterval(() => {
      setUptimeStr(formatUptime(connectedAt));
    }, 1000);
    setUptimeStr(formatUptime(connectedAt));
    return () => clearInterval(interval);
  }, [status, connectedAt]);

  if (status === 'disconnected') {
    return (
      <View style={[bannerStyles.container, bannerStyles.disconnected]}>
        <Feather name="wifi-off" size={16} color={colors.text.muted} />
        <Text style={[bannerStyles.text, { color: colors.text.muted }]}>{t('home_no_connection')}</Text>
        <Feather name="chevron-down" size={14} color={colors.text.muted} />
      </View>
    );
  }

  if (status === 'reconnecting') {
    return (
      <View style={[bannerStyles.container, bannerStyles.reconnecting]}>
        <Animated.View style={[bannerStyles.dot, { backgroundColor: colors.status.connecting }, dotStyle]} />
        <Text style={[bannerStyles.text, { color: colors.status.connecting }]}>{t('home_reconnecting')}</Text>
      </View>
    );
  }

  if (status === 'connecting') {
    return (
      <View style={[bannerStyles.container, bannerStyles.connecting]}>
        <View style={[bannerStyles.dot, { backgroundColor: colors.status.connecting }]} />
        <Text style={[bannerStyles.text, { color: colors.status.connecting }]}>{t('home_connecting')}</Text>
      </View>
    );
  }

  // connected
  return (
    <View style={[bannerStyles.container, bannerStyles.connected]}>
      <Animated.View style={[bannerStyles.dot, bannerStyles.dotConnected, dotStyle]} />
      <Text style={[bannerStyles.text, { color: colors.status.connected }]} numberOfLines={1}>
        {currentDevice?.name ?? 'Device'}
      </Text>
      <Feather
        name={connectionType === 'ble' ? 'bluetooth' : 'wifi'}
        size={14}
        color={colors.status.connected}
      />
      {uptimeStr ? (
        <Text style={bannerStyles.uptime}>{uptimeStr}</Text>
      ) : null}
    </View>
  );
}

const bannerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.innerCard,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    marginBottom: spacing.md,
    gap: 8,
  },
  disconnected: {
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reconnecting: {
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.3)',
  },
  connecting: {
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.2)',
  },
  connected: {
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotConnected: {
    backgroundColor: colors.status.connected,
    shadowColor: colors.status.connected,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 4,
  },
  text: {
    ...typography.bodySmall,
    fontWeight: '600',
    flex: 1,
  },
  uptime: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});

// ---------------------------------------------------------------------------
// Home Screen
// ---------------------------------------------------------------------------

export default function HomeScreen() {
  const router = useRouter();

  // Stores
  const connect = useConnectionStore((s) => s.connect);
  const connectBLE = useConnectionStore((s) => s.connectBLE);
  const devices = useDiscoveryStore((s) => s.devices);
  const addDevice = useDiscoveryStore((s) => s.addDevice);
  const removeDevice = useDiscoveryStore((s) => s.removeDevice);
  const refreshDevices = useDiscoveryStore((s) => s.refreshDevices);
  const recentConnections = useDiscoveryStore((s) => s.recentConnections);
  const addRecentConnection = useDiscoveryStore((s) => s.addRecentConnection);
  const loadRecentConnections = useDiscoveryStore((s) => s.loadRecentConnections);
  const defaultPort = useSettingsStore((s) => s.defaultPort);
  const autoReconnect = useSettingsStore((s) => s.autoReconnect);
  const connectionTimeout = useSettingsStore((s) => s.connectionTimeout);
  const hasAccess = usePurchaseStore((s) => s.hasAccess);
  const isPurchased = usePurchaseStore((s) => s.isPurchased);
  const trialDaysRemaining = usePurchaseStore((s) => s.trialDaysRemaining);
  const isDeviceTrusted = useTrustStore((s) => s.isDeviceTrusted);
  const trustDevice = useTrustStore((s) => s.trustDevice);

  // Manual connection state
  const [manualIp, setManualIp] = useState('');
  const [manualPort, setManualPort] = useState('');
  const [manualTimeout, setManualTimeout] = useState('');
  const [manualAutoReconnect, setManualAutoReconnect] = useState(autoReconnect);

  // Connect modal state
  const [modalDevice, setModalDevice] = useState<Device | null>(null);

  // Discovery refs
  const discoveryRef = useRef<DeviceDiscovery | null>(null);
  const bleDiscoveryRef = useRef<BleDiscovery | null>(null);

  // -------------------------------------------------------------------
  // Discovery lifecycle (WiFi + BLE)
  // -------------------------------------------------------------------

  useEffect(() => {
    loadRecentConnections();

    // WiFi (mDNS) discovery
    const discovery = new DeviceDiscovery(
      (device: Device) => addDevice(device),
      (name: string) => removeDevice(name),
    );
    discoveryRef.current = discovery;
    discovery.startScan();

    // BLE discovery (may not be available on simulator)
    const bleManager = getBleManager();
    if (bleManager) {
      const bleDiscovery = new BleDiscovery(
        bleManager,
        (device: Device) => addDevice(device),
        (name: string) => removeDevice(name),
      );
      bleDiscoveryRef.current = bleDiscovery;
      bleDiscovery.startScan();
    }

    // Periodic refresh: mark stale devices as offline
    const refreshInterval = setInterval(() => {
      refreshDevices();
    }, 5_000);

    return () => {
      discovery.destroy();
      discoveryRef.current = null;
      bleDiscoveryRef.current?.destroy();
      bleDiscoveryRef.current = null;
      clearInterval(refreshInterval);
    };
  }, []);

  // -------------------------------------------------------------------
  // Connect helpers
  // -------------------------------------------------------------------

  const doConnect = useCallback(
    (device: Device) => {
      if (device.connectionType === 'ble') {
        connectBLE(device.host, device.name);
      } else {
        connect(device.host, device.port, device.name);
      }
      addRecentConnection({
        host: device.host,
        port: device.port,
        deviceName: device.name,
        lastConnected: new Date(),
      });
      router.push('/(tabs)/analytics' as any);
    },
    [connect, connectBLE, addRecentConnection, router],
  );

  const connectToDevice = useCallback(
    (host: string, port: number, deviceName?: string) => {
      if (!hasAccess) {
        router.push('/paywall');
        return;
      }
      doConnect({
        name: deviceName || `${host}:${port}`,
        host,
        port,
        connectionType: 'wifi',
        isOnline: true,
        lastSeen: new Date(),
      });
    },
    [doConnect, hasAccess, router],
  );

  const handleDeviceTap = useCallback(
    (device: Device) => {
      if (!device.isOnline) return;
      if (!hasAccess) {
        router.push('/paywall');
        return;
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setModalDevice(device);
    },
    [hasAccess, router],
  );

  const handleModalConnect = useCallback(() => {
    if (!modalDevice) return;

    // Trust if needed
    if (modalDevice.deviceId && !isDeviceTrusted(modalDevice.deviceId)) {
      trustDevice({
        deviceId: modalDevice.deviceId,
        name: modalDevice.name,
        trustedAt: new Date(),
        lastSeen: new Date(),
        connectionType: modalDevice.connectionType ?? 'wifi',
      });
    }

    doConnect(modalDevice);
    setModalDevice(null);
  }, [modalDevice, doConnect, isDeviceTrusted, trustDevice]);

  const handleRescan = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Clear stale devices and restart BLE scan
    useDiscoveryStore.getState().clearDevices();
    bleDiscoveryRef.current?.stopScan();
    bleDiscoveryRef.current?.startScan();
    discoveryRef.current?.destroy();
    const discovery = new DeviceDiscovery(
      (device: Device) => addDevice(device),
      (name: string) => removeDevice(name),
    );
    discoveryRef.current = discovery;
    discovery.startScan();
  }, [addDevice, removeDevice]);

  const handleManualConnect = useCallback(() => {
    const ip = manualIp.trim();
    if (!ip) return;
    // Validate IPv4 format
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip) || ip.split('.').some((n) => parseInt(n, 10) > 255)) {
      Alert.alert(t('validation_invalid_ip'), t('validation_invalid_ip_msg'));
      return;
    }
    const port = manualPort.trim() ? parseInt(manualPort.trim(), 10) : defaultPort;
    if (isNaN(port) || port < 1 || port > 65535) {
      Alert.alert(t('validation_invalid_port'), t('validation_invalid_port_msg'));
      return;
    }
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
          <Image
            source={require('../../assets/icon.png')}
            style={styles.headerIcon}
          />
          <Text style={styles.headerTitle}>{t('home_title')}</Text>
        </View>

        {/* ---- Connection Status Banner ---- */}
        <ConnectionBanner />

        {/* ---- Trial Banner (hidden in FREE_MODE) ---- */}
        {!getEffectiveFreeMode() && !isPurchased && (
          <Pressable
            style={[
              styles.trialBanner,
              trialDaysRemaining <= 0 && styles.trialBannerExpired,
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/paywall');
            }}
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
                ? t('home_trial_remaining')(trialDaysRemaining)
                : t('home_trial_expired')}
            </Text>
            <Feather name="chevron-right" size={16} color={colors.text.muted} />
          </Pressable>
        )}

        {/* ---- Discovered ---- */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionHeader, { marginTop: 0, marginBottom: 0 }]}>{t('home_discovered')}</Text>
          <Pressable
            style={styles.rescanButton}
            onPress={handleRescan}
            hitSlop={12}
          >
            <Feather name="refresh-cw" size={16} color={colors.accent.primary} />
          </Pressable>
        </View>

        {devices.length > 0 && (
          <View style={styles.tapHint}>
            <Feather name="arrow-down" size={14} color={colors.accent.primary} />
            <Text style={styles.tapHintText}>{t('home_tap_to_connect')}</Text>
          </View>
        )}

        {devices.map((device) => {
          const isOnline = device.isOnline;
          const trusted = device.deviceId ? isDeviceTrusted(device.deviceId) : false;
          return (
            <NeuCard
              key={device.name}
              style={styles.deviceCard}
              onPress={() => handleDeviceTap(device)}
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
                    name={device.connectionType === 'ble' ? 'bluetooth' : 'wifi'}
                    size={24}
                    color={
                      isOnline ? colors.accent.primary : colors.text.muted
                    }
                  />
                </View>

                {/* Name / status */}
                <View style={styles.deviceInfo}>
                  <View style={styles.deviceNameRow}>
                    <Text
                      style={[
                        styles.deviceName,
                        !isOnline && styles.deviceNameOffline,
                      ]}
                      numberOfLines={1}
                    >
                      {device.name}
                    </Text>
                    {device.deviceId && (
                      <Text style={styles.deviceIdShort}>
                        {device.deviceId.slice(-4)}
                      </Text>
                    )}
                    {device.deviceId && (
                      <Feather
                        name={trusted ? 'check-circle' : 'shield'}
                        size={14}
                        color={trusted ? colors.status.connected : colors.text.muted}
                        style={{ marginLeft: 4 }}
                      />
                    )}
                  </View>
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
                    <Text style={styles.deviceAddress} numberOfLines={1}>
                      {isOnline
                        ? `${device.host}:${device.port}${device.deviceType ? ` \u2022 ${device.deviceType}` : ''}${device.libraryVersion ? ` \u2022 v${device.libraryVersion}` : ''}`
                        : `${t('home_offline')} \u2022 ${timeAgo(device.lastSeen)}`}
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
              <Feather name="search" size={18} color={colors.text.muted} />
              <Text style={styles.emptyText}>{t('home_scanning')}</Text>
            </View>
            <Text style={styles.emptyHint}>{t('home_scanning_hint')}</Text>
          </NeuCard>
        )}

        {/* ---- WiFi Connection ---- */}
        <Text style={styles.sectionHeader}>{t('home_wifi_connection')}</Text>

        <NeuCard style={styles.manualCard}>
          <NeuInput
            icon="globe"
            placeholder={t('home_ip_placeholder')}
            value={manualIp}
            onChangeText={setManualIp}
            keyboardType="numeric"
            autoCapitalize="none"
            autoCorrect={false}
            containerStyle={styles.inputContainer}
          />
          <View style={styles.portTimeoutRow}>
            <NeuInput
              icon="hash"
              placeholder={t('home_port_placeholder')(defaultPort)}
              value={manualPort}
              onChangeText={setManualPort}
              keyboardType="number-pad"
              containerStyle={styles.halfInput}
            />
            <NeuInput
              icon="clock"
              placeholder={t('home_timeout_placeholder')(connectionTimeout / 1000)}
              value={manualTimeout}
              onChangeText={setManualTimeout}
              keyboardType="number-pad"
              containerStyle={styles.halfInput}
            />
          </View>

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>{t('home_auto_reconnect')}</Text>
            <Switch
              value={manualAutoReconnect}
              onValueChange={setManualAutoReconnect}
              trackColor={{ false: colors.bg.surfaceLight, true: colors.accent.glow }}
              thumbColor={manualAutoReconnect ? colors.accent.primary : colors.text.secondary}
            />
          </View>

          <View style={styles.hintRow}>
            <Feather name="info" size={14} color={colors.text.muted} />
            <Text style={styles.hintText}>
              {t('home_wifi_hint')}
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.connectButton,
              pressed && styles.connectButtonPressed,
              !manualIp.trim() && styles.connectButtonDisabled,
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              handleManualConnect();
            }}
            disabled={!manualIp.trim()}
          >
            <Feather name="wifi" size={18} color={colors.bg.primary} />
            <Text style={styles.connectButtonText}>{t('home_connect_wifi')}</Text>
          </Pressable>
        </NeuCard>

        {/* ---- Recent ---- */}
        {recentConnections.length > 0 && (
          <>
            <Text style={styles.sectionHeader}>{t('home_recent')}</Text>

            {recentConnections.map((recent: RecentConnection, index: number) => (
              <Pressable
                key={`${recent.host}:${recent.port}-${index}`}
                style={styles.recentItem}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  connectToDevice(
                    recent.host,
                    recent.port,
                    recent.deviceName,
                  );
                }}
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

        {/* ---- Test Code ---- */}
        <Text style={styles.sectionHeader}>{t('home_generate_code')}</Text>
        <Pressable
          style={styles.codeGenButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/(tabs)/codegen' as any);
          }}
        >
          <View style={styles.codeGenIcon}>
            <Feather name="code" size={18} color={colors.accent.primary} />
          </View>
          <View style={styles.codeGenText}>
            <Text style={styles.codeGenTitle}>{t('home_generate_code_sub')}</Text>
          </View>
          <Feather name="chevron-right" size={18} color={colors.text.muted} />
        </Pressable>

        {/* Bottom spacing so content isn't hidden behind tab bar */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      <CoachMark
        id="home"
        steps={[
          { icon: 'search', title: t('coach_home_1_title'), description: t('coach_home_1_desc') },
          { icon: 'shield', title: t('coach_home_2_title'), description: t('coach_home_2_desc') },
          { icon: 'activity', title: t('coach_home_3_title'), description: t('coach_home_3_desc') },
        ]}
        dismissLabel={t('coach_ok')}
      />

      {/* Connect Modal */}
      {modalDevice !== null && (
        <Pressable style={modalStyles.overlay} onPress={() => setModalDevice(null)}>
          <Pressable style={modalStyles.card} onPress={() => {}}>
            {/* Device icon & name */}
            <View style={modalStyles.deviceHeader}>
              <View style={modalStyles.iconCircle}>
                <Feather
                  name={modalDevice?.connectionType === 'ble' ? 'bluetooth' : 'wifi'}
                  size={28}
                  color={colors.accent.primary}
                />
              </View>
              <Text style={modalStyles.deviceName}>{modalDevice?.name}</Text>
              {modalDevice?.deviceId && (
                <Text style={modalStyles.deviceId}>{modalDevice.deviceId}</Text>
              )}
            </View>

            {/* Connection details */}
            <View style={modalStyles.details}>
              <View style={modalStyles.detailRow}>
                <Feather name="globe" size={16} color={colors.text.muted} />
                <Text style={modalStyles.detailLabel}>IP</Text>
                <Text style={modalStyles.detailValue}>{modalDevice?.host}</Text>
              </View>
              <View style={modalStyles.detailRow}>
                <Feather name="hash" size={16} color={colors.text.muted} />
                <Text style={modalStyles.detailLabel}>Port</Text>
                <Text style={modalStyles.detailValue}>{modalDevice?.port}</Text>
              </View>
              {modalDevice?.deviceType && (
                <View style={modalStyles.detailRow}>
                  <Feather name="cpu" size={16} color={colors.text.muted} />
                  <Text style={modalStyles.detailLabel}>Type</Text>
                  <Text style={modalStyles.detailValue}>{modalDevice.deviceType}</Text>
                </View>
              )}
              {modalDevice?.connectionType && (
                <View style={modalStyles.detailRow}>
                  <Feather name="radio" size={16} color={colors.text.muted} />
                  <Text style={modalStyles.detailLabel}>Via</Text>
                  <Text style={modalStyles.detailValue}>
                    {modalDevice.connectionType === 'ble' ? 'Bluetooth' : 'WiFi'}
                  </Text>
                </View>
              )}
              {modalDevice?.deviceId && !isDeviceTrusted(modalDevice.deviceId) && (
                <View style={modalStyles.trustHint}>
                  <Feather name="shield" size={14} color={colors.accent.primary} />
                  <Text style={modalStyles.trustHintText}>{t('home_trust_title')}</Text>
                </View>
              )}
            </View>

            {/* Buttons */}
            <Pressable
              style={modalStyles.connectButton}
              onPress={handleModalConnect}
            >
              <Feather name="zap" size={18} color={colors.bg.primary} />
              <Text style={modalStyles.connectButtonText}>{t('home_connect_button')}</Text>
            </Pressable>

            <Pressable
              style={modalStyles.cancelButton}
              onPress={() => setModalDevice(null)}
            >
              <Text style={modalStyles.cancelText}>{t('cancel')}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    zIndex: 999,
  },
  card: {
    width: '100%',
    backgroundColor: colors.bg.surface,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  deviceHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.bg.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  deviceName: {
    ...typography.titleSmall,
    color: colors.text.primary,
    textAlign: 'center',
  },
  deviceId: {
    ...typography.caption,
    color: colors.text.muted,
    marginTop: 4,
    fontFamily: 'Menlo',
  },
  details: {
    backgroundColor: colors.bg.surfaceLight,
    borderRadius: borderRadius.innerCard,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailLabel: {
    ...typography.caption,
    color: colors.text.muted,
    width: 40,
  },
  detailValue: {
    ...typography.body,
    color: colors.text.primary,
    fontFamily: 'Menlo',
    flex: 1,
  },
  trustHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  trustHintText: {
    ...typography.caption,
    color: colors.accent.primary,
    fontWeight: '600',
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent.primary,
    borderRadius: borderRadius.innerCard,
    paddingVertical: 14,
    marginBottom: spacing.sm,
  },
  connectButtonText: {
    ...typography.body,
    color: colors.bg.primary,
    fontWeight: '700',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  cancelText: {
    ...typography.bodySmall,
    color: colors.text.muted,
  },
});

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
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    marginRight: spacing.sm,
  },
  headerTitle: {
    ...typography.headerTitle,
    color: colors.text.primary,
  },

  // Section headers
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    ...typography.sectionHeader,
    color: colors.text.secondary,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  rescanButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
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
  deviceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  deviceName: {
    ...typography.deviceName,
    color: colors.text.primary,
    flexShrink: 1,
  },
  deviceNameOffline: {
    color: colors.text.muted,
  },
  deviceIdShort: {
    fontFamily: 'Menlo',
    fontSize: 11,
    color: '#FF9800',
    backgroundColor: 'rgba(255, 152, 0, 0.12)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
    overflow: 'hidden',
    fontWeight: '700',
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
    flex: 1,
  },

  // Empty state
  emptyCard: {
    marginBottom: spacing.md,
  },
  emptyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  emptyText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  emptyHint: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 16,
    fontSize: 11,
  },
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: spacing.sm,
  },
  tapHintText: {
    ...typography.caption,
    color: colors.accent.primary,
    fontWeight: '600',
  },

  // WiFi connection card
  manualCard: {
    gap: spacing.md,
  },
  inputContainer: {},
  portTimeoutRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  toggleLabel: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    flex: 1,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.bg.surfaceLight,
    borderRadius: borderRadius.small,
    padding: spacing.sm,
  },
  hintText: {
    ...typography.caption,
    color: colors.text.muted,
    flex: 1,
    lineHeight: 18,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent.primary,
    borderRadius: borderRadius.innerCard,
    paddingVertical: 14,
  },
  connectButtonPressed: {
    opacity: 0.85,
  },
  connectButtonDisabled: {
    opacity: 0.4,
  },
  connectButtonText: {
    ...typography.body,
    color: colors.bg.primary,
    fontWeight: '700',
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
    height: Platform.OS === 'android' ? 100 : 140,
  },
});
