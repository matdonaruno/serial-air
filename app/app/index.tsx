import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DeviceCard } from '../src/components/DeviceCard';
import { ManualConnect } from '../src/components/ManualConnect';
import { useDiscoveryStore } from '../src/stores/useDiscoveryStore';
import { useConnectionStore } from '../src/stores/useConnectionStore';
import { DeviceDiscovery } from '../src/services/DeviceDiscovery';
import { Device } from '../src/types';
import { COLORS } from '../src/constants/defaults';

let discovery: DeviceDiscovery | null = null;

export default function HomeScreen() {
  const colors = COLORS.dark;
  const devices = useDiscoveryStore((s) => s.devices);
  const recentConnections = useDiscoveryStore((s) => s.recentConnections);
  const isScanning = useDiscoveryStore((s) => s.isScanning);
  const addDevice = useDiscoveryStore((s) => s.addDevice);
  const removeDevice = useDiscoveryStore((s) => s.removeDevice);
  const setScanning = useDiscoveryStore((s) => s.setScanning);
  const addRecentConnection = useDiscoveryStore((s) => s.addRecentConnection);
  const connect = useConnectionStore((s) => s.connect);

  useEffect(() => {
    discovery = new DeviceDiscovery(
      (device) => addDevice(device),
      (name) => removeDevice(name)
    );
    discovery.startScan();
    setScanning(true);

    return () => {
      if (discovery) {
        discovery.destroy();
        discovery = null;
        setScanning(false);
      }
    };
  }, []);

  const handleDevicePress = useCallback(
    (device: Device) => {
      connect(device.host, device.port, device.name);
      addRecentConnection({
        host: device.host,
        port: device.port,
        deviceName: device.name,
        lastConnected: new Date(),
      });
      router.push('/monitor');
    },
    [connect, addRecentConnection]
  );

  const handleManualConnect = useCallback(
    (host: string, port: number) => {
      connect(host, port);
      addRecentConnection({
        host,
        port,
        lastConnected: new Date(),
      });
      router.push('/monitor');
    },
    [connect, addRecentConnection]
  );

  const handleRecentPress = useCallback(
    (host: string, port: number, name?: string) => {
      connect(host, port, name);
      addRecentConnection({
        host,
        port,
        deviceName: name,
        lastConnected: new Date(),
      });
      router.push('/monitor');
    },
    [connect, addRecentConnection]
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Header actions */}
      <View style={styles.headerActions}>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => router.push('/settings')}
        >
          <Ionicons name="settings-outline" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Discovered Devices */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="radio-outline" size={20} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Discovered Devices
          </Text>
          {isScanning && (
            <Text style={[styles.scanLabel, { color: colors.primary }]}>
              Scanning...
            </Text>
          )}
        </View>

        {devices.length === 0 ? (
          <View style={[styles.emptyState, { borderColor: colors.border }]}>
            <Ionicons name="wifi-outline" size={40} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No devices found
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
              Make sure your ESP device is running WirelessSerial{'\n'}
              and connected to the same WiFi network
            </Text>
          </View>
        ) : (
          devices.map((device) => (
            <DeviceCard
              key={device.name}
              device={device}
              onPress={handleDevicePress}
            />
          ))
        )}
      </View>

      {/* Manual Connection */}
      <View style={styles.section}>
        <ManualConnect onConnect={handleManualConnect} />
      </View>

      {/* Recent Connections */}
      {recentConnections.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Recent Connections
          </Text>
          {recentConnections.map((conn, index) => (
            <TouchableOpacity
              key={`${conn.host}:${conn.port}-${index}`}
              style={styles.recentItem}
              onPress={() =>
                handleRecentPress(conn.host, conn.port, conn.deviceName)
              }
            >
              <Ionicons
                name="time-outline"
                size={16}
                color={colors.textMuted}
              />
              <Text style={[styles.recentText, { color: colors.textSecondary }]}>
                {conn.deviceName || `${conn.host}:${conn.port}`}
              </Text>
              <Text style={[styles.recentTime, { color: colors.textMuted }]}>
                {formatTimeAgo(conn.lastConnected)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  return `${days}d ago`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  settingsButton: {
    padding: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 8,
  },
  scanLabel: {
    fontSize: 13,
    marginLeft: 'auto',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  recentText: {
    fontSize: 15,
    marginLeft: 8,
    flex: 1,
  },
  recentTime: {
    fontSize: 13,
  },
});
