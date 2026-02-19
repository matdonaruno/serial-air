import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ConnectionStatus } from '../types';
import { COLORS } from '../constants/defaults';

interface ConnectionBarProps {
  status: ConnectionStatus;
  deviceName: string;
}

const STATUS_CONFIG: Record<
  ConnectionStatus,
  { label: string; colorKey: 'success' | 'warning' | 'error' | 'textMuted' }
> = {
  connected: { label: 'Connected', colorKey: 'success' },
  connecting: { label: 'Connecting...', colorKey: 'warning' },
  reconnecting: { label: 'Reconnecting...', colorKey: 'warning' },
  disconnected: { label: 'Disconnected', colorKey: 'error' },
};

export function ConnectionBar({ status, deviceName }: ConnectionBarProps) {
  const colors = COLORS.dark;
  const config = STATUS_CONFIG[status];

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.deviceName, { color: colors.text }]} numberOfLines={1}>
        {deviceName}
      </Text>
      <View style={styles.statusContainer}>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: colors[config.colorKey] },
          ]}
        />
        <Text style={[styles.statusText, { color: colors[config.colorKey] }]}>
          {config.label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
