import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { NeuButton, NeuContainer, NeuInput } from '../src/components/neumorphic';
import { useConnectionStore } from '../src/stores/useConnectionStore';
import { useLogStore } from '../src/stores/useLogStore';
import { useSettingsStore } from '../src/stores/useSettingsStore';
import { formatTimestamp } from '../src/utils/formatTimestamp';
import { exportLogToText } from '../src/utils/logExporter';
import {
  colors,
  spacing,
  typography,
  borderRadius,
  layout,
  animation,
  neuShadow,
} from '../src/constants/theme';
import { LogLine } from '../src/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getLineColor(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('error') || lower.includes('fail')) return colors.log.error;
  if (lower.includes('warn')) return colors.log.warning;
  if (lower.includes('success') || lower.includes('ok') || lower.includes('done'))
    return colors.log.success;
  return colors.text.primary;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Pulsing green dot for connected status */
function StatusDot() {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.3, {
          duration: animation.statusPulse.duration / 2,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(1, {
          duration: animation.statusPulse.duration / 2,
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1,
      false,
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.statusDot, animStyle]}>
      <View style={styles.statusDotInner} />
    </Animated.View>
  );
}

/** Blinking cursor at the bottom of the terminal */
function BlinkingCursor() {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0, {
          duration: animation.statusBlink.duration,
          easing: Easing.steps(1, true),
        }),
        withTiming(1, {
          duration: animation.statusBlink.duration,
          easing: Easing.steps(1, true),
        }),
      ),
      -1,
      false,
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={styles.cursorRow}>
      <Text style={styles.cursorPrompt}>&gt; </Text>
      <Animated.Text style={[styles.cursorBlock, animStyle]}>
        {'\u2588'}
      </Animated.Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Log line renderer
// ---------------------------------------------------------------------------

const LogLineRow = React.memo(({ item }: { item: LogLine }) => {
  const lineColor = getLineColor(item.text);
  return (
    <View style={styles.logLine}>
      <Text style={styles.logTimestamp}>{formatTimestamp(item.timestamp)}</Text>
      <Text style={[styles.logText, { color: lineColor }]} numberOfLines={4}>
        {item.text}
      </Text>
    </View>
  );
});

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function MonitorScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [commandText, setCommandText] = useState('');

  // --- stores ---
  const status = useConnectionStore((s) => s.status);
  const currentDevice = useConnectionStore((s) => s.currentDevice);
  const sendCommand = useConnectionStore((s) => s.sendCommand);
  const disconnect = useConnectionStore((s) => s.disconnect);

  const lines = useLogStore((s) => s.lines);
  const isPaused = useLogStore((s) => s.isPaused);
  const filter = useLogStore((s) => s.filter);
  const clear = useLogStore((s) => s.clear);
  const togglePause = useLogStore((s) => s.togglePause);
  const getFilteredLines = useLogStore((s) => s.getFilteredLines);

  const autoScroll = useSettingsStore((s) => s.autoScroll);

  const filteredLines = useMemo(() => getFilteredLines(), [lines, filter]);

  // --- auto-scroll ---
  useEffect(() => {
    if (autoScroll && !isPaused && filteredLines.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 50);
    }
  }, [filteredLines.length, autoScroll, isPaused]);

  // --- disconnect on unmount ---
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  // --- handlers ---
  const handleBack = useCallback(() => {
    disconnect();
    router.back();
  }, [disconnect, router]);

  const handleClear = useCallback(() => {
    Alert.alert('Clear Logs', 'Are you sure you want to clear all logs?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => clear() },
    ]);
  }, [clear]);

  const handleExport = useCallback(async () => {
    try {
      await exportLogToText(filteredLines);
    } catch {
      Alert.alert('Export Error', 'Failed to export log file.');
    }
  }, [filteredLines]);

  const handleReset = useCallback(() => {
    if (currentDevice) {
      disconnect();
      // Small delay to allow socket cleanup before reconnecting
      setTimeout(() => {
        if (currentDevice) {
          useConnectionStore
            .getState()
            .connect(currentDevice.host, currentDevice.port, currentDevice.name);
        }
      }, 300);
    }
  }, [currentDevice, disconnect]);

  const handleSend = useCallback(() => {
    const trimmed = commandText.trim();
    if (!trimmed) return;
    sendCommand(trimmed);
    setCommandText('');
  }, [commandText, sendCommand]);

  // --- derived ---
  const isConnected = status === 'connected';
  const statusLabel = status === 'connected'
    ? 'CONNECTED'
    : status === 'connecting'
    ? 'CONNECTING'
    : status === 'reconnecting'
    ? 'RECONNECTING'
    : 'DISCONNECTED';
  const statusColor = status === 'connected'
    ? colors.status.connected
    : status === 'connecting' || status === 'reconnecting'
    ? colors.status.connecting
    : colors.status.disconnected;

  // --- render ---
  const renderLogLine = useCallback(
    ({ item }: { item: LogLine }) => <LogLineRow item={item} />,
    [],
  );

  const keyExtractor = useCallback((item: LogLine) => String(item.id), []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ============================================================ */}
        {/* Header                                                        */}
        {/* ============================================================ */}
        <View style={styles.header}>
          <NeuButton icon="arrow-left" onPress={handleBack} size={layout.actionButtonSize} />

          <Text style={styles.headerTitle}>
            {currentDevice?.name ?? 'ESP-SERIAL'}
          </Text>

          <View style={styles.statusBadge}>
            {isConnected && <StatusDot />}
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusLabel}
            </Text>
          </View>
        </View>

        {/* ============================================================ */}
        {/* Terminal Area                                                  */}
        {/* ============================================================ */}
        <NeuContainer style={styles.terminalContainer}>
          {/* Meta bar */}
          <View style={styles.metaBar}>
            <Text style={styles.metaText}>/dev/ttyUSB0</Text>
            <Text style={styles.metaText}>115200 BAUD</Text>
          </View>

          {/* Log viewer */}
          <FlatList
            ref={flatListRef}
            data={filteredLines}
            renderItem={renderLogLine}
            keyExtractor={keyExtractor}
            style={styles.logList}
            contentContainerStyle={styles.logListContent}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={<BlinkingCursor />}
          />
        </NeuContainer>

        {/* ============================================================ */}
        {/* Action Buttons                                                */}
        {/* ============================================================ */}
        <View style={styles.actionsRow}>
          <NeuButton
            icon="trash-2"
            label="Clear"
            onPress={handleClear}
            size={layout.actionButtonSize}
          />
          <NeuButton
            icon="share"
            label="Export"
            onPress={handleExport}
            size={layout.actionButtonSize}
          />
          <NeuButton
            icon={isPaused ? 'play' : 'pause'}
            label={isPaused ? 'Resume' : 'Pause'}
            onPress={togglePause}
            active={isPaused}
            size={layout.actionButtonSize}
          />
          <NeuButton
            icon="refresh-cw"
            label="Reset"
            onPress={handleReset}
            size={layout.actionButtonSize}
          />
        </View>

        {/* ============================================================ */}
        {/* Command Input                                                 */}
        {/* ============================================================ */}
        <View style={styles.inputRow}>
          <NeuInput
            icon="terminal"
            placeholder="Send Command..."
            value={commandText}
            onChangeText={setCommandText}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            autoCapitalize="none"
            autoCorrect={false}
            containerStyle={styles.inputWrapper}
            style={styles.inputMono}
          />
          <NeuButton
            icon="send"
            onPress={handleSend}
            size={56}
            variant="accent"
            disabled={!isConnected || commandText.trim().length === 0}
          />
        </View>
      </KeyboardAvoidingView>
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
  flex: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPaddingH,
    paddingVertical: spacing.sm,
    height: layout.headerHeight,
  },
  headerTitle: {
    ...typography.headerTitle,
    color: colors.text.primary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.status.connectedGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.status.connected,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  // Terminal
  terminalContainer: {
    flex: 1,
    marginHorizontal: layout.screenPaddingH,
    marginTop: spacing.xs,
    padding: spacing.md,
  },
  metaBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  metaText: {
    fontFamily: 'Menlo',
    fontSize: 10,
    color: colors.text.primary,
    opacity: 0.3,
  },
  logList: {
    flex: 1,
  },
  logListContent: {
    paddingBottom: spacing.sm,
  },

  // Log lines
  logLine: {
    flexDirection: 'row',
    paddingVertical: 3,
    gap: spacing.sm,
  },
  logTimestamp: {
    ...typography.logTimestamp,
    color: colors.log.info,
  },
  logText: {
    ...typography.logText,
    flex: 1,
    color: colors.text.primary,
  },

  // Blinking cursor
  cursorRow: {
    flexDirection: 'row',
    paddingTop: spacing.xs,
    alignItems: 'center',
  },
  cursorPrompt: {
    fontFamily: 'Menlo',
    fontSize: 13,
    color: colors.accent.primary,
  },
  cursorBlock: {
    fontFamily: 'Menlo',
    fontSize: 13,
    color: colors.accent.primary,
  },

  // Action buttons
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: layout.screenPaddingH,
  },

  // Command input
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.screenPaddingH,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  inputWrapper: {
    flex: 1,
  },
  inputMono: {
    fontFamily: 'Menlo',
    fontSize: 14,
  },
});
