import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Device } from '../types';
import { COLORS } from '../constants/defaults';

interface DeviceCardProps {
  device: Device;
  onPress: (device: Device) => void;
}

function formatLastSeen(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function DeviceCard({ device, onPress }: DeviceCardProps) {
  const colors = COLORS.dark;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => onPress(device)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.nameRow}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: device.isOnline ? colors.success : colors.error },
            ]}
          />
          <Text style={[styles.name, { color: colors.text }]}>
            {device.name}
          </Text>
          {!device.isOnline && (
            <Text style={[styles.offlineLabel, { color: colors.textMuted }]}>
              (offline)
            </Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </View>

      <Text style={[styles.address, { color: colors.textSecondary }]}>
        {device.host}:{device.port}
        {device.deviceType ? ` \u2022 ${device.deviceType}` : ''}
      </Text>

      {!device.isOnline && (
        <Text style={[styles.lastSeen, { color: colors.textMuted }]}>
          Last seen: {formatLastSeen(device.lastSeen)}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
  },
  offlineLabel: {
    fontSize: 14,
    marginLeft: 6,
  },
  address: {
    fontSize: 14,
    marginTop: 4,
    marginLeft: 18,
  },
  lastSeen: {
    fontSize: 13,
    marginTop: 2,
    marginLeft: 18,
  },
});
