import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { ConnectionBar } from '../src/components/ConnectionBar';
import { FilterBar } from '../src/components/FilterBar';
import { LogViewer } from '../src/components/LogViewer';
import { CommandInput } from '../src/components/CommandInput';
import { useConnectionStore } from '../src/stores/useConnectionStore';
import { useLogStore } from '../src/stores/useLogStore';
import { useSettingsStore } from '../src/stores/useSettingsStore';
import { COLORS } from '../src/constants/defaults';
import { exportLogToText } from '../src/utils/logExporter';

export default function MonitorScreen() {
  const colors = COLORS.dark;
  const status = useConnectionStore((s) => s.status);
  const currentDevice = useConnectionStore((s) => s.currentDevice);
  const sendCommand = useConnectionStore((s) => s.sendCommand);

  const lines = useLogStore((s) => s.lines);
  const isPaused = useLogStore((s) => s.isPaused);
  const filter = useLogStore((s) => s.filter);
  const setFilter = useLogStore((s) => s.setFilter);
  const togglePause = useLogStore((s) => s.togglePause);
  const clear = useLogStore((s) => s.clear);
  const getFilteredLines = useLogStore((s) => s.getFilteredLines);

  const autoScroll = useSettingsStore((s) => s.autoScroll);

  const filteredLines = useMemo(() => getFilteredLines(), [lines, filter]);

  const handleCopy = useCallback(async () => {
    const text = filteredLines.map((l) => l.text).join('\n');
    await Clipboard.setStringAsync(text);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [filteredLines]);

  const handleExport = useCallback(async () => {
    try {
      await exportLogToText(filteredLines);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert('Export Error', 'Failed to export log file.');
    }
  }, [filteredLines]);

  const handleClear = useCallback(() => {
    Alert.alert('Clear Logs', 'Are you sure you want to clear all logs?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => clear(),
      },
    ]);
  }, [clear]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Connection status bar */}
      <ConnectionBar
        status={status}
        deviceName={currentDevice?.name || 'Unknown'}
      />

      {/* Filter bar */}
      <FilterBar value={filter} onChangeText={setFilter} />

      {/* Log viewer */}
      <LogViewer lines={filteredLines} autoScroll={autoScroll && !isPaused} />

      {/* Toolbar */}
      <View style={[styles.toolbar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.lineCount, { color: colors.textSecondary }]}>
          Lines: {filteredLines.length}
        </Text>

        <View style={styles.toolbarActions}>
          <TouchableOpacity
            style={styles.toolButton}
            onPress={togglePause}
          >
            <Ionicons
              name={isPaused ? 'play' : 'pause'}
              size={20}
              color={isPaused ? colors.warning : colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolButton} onPress={handleCopy}>
            <Ionicons name="clipboard-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolButton} onPress={handleExport}>
            <Ionicons name="save-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolButton} onPress={handleClear}>
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Command input */}
      <CommandInput
        onSend={sendCommand}
        disabled={status !== 'connected'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  lineCount: {
    fontSize: 13,
  },
  toolbarActions: {
    flexDirection: 'row',
    gap: 12,
  },
  toolButton: {
    padding: 6,
  },
});
