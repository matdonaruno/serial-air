import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Pressable,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import Svg, { Polyline, Line, Text as SvgText } from 'react-native-svg';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';

import { NeuButton, NeuContainer, NeuInput } from '../../src/components/neumorphic';
import { useConnectionStore } from '../../src/stores/useConnectionStore';
import { useLogStore } from '../../src/stores/useLogStore';
import { useSettingsStore } from '../../src/stores/useSettingsStore';
import { formatTimestamp } from '../../src/utils/formatTimestamp';
import { exportLogToText } from '../../src/utils/logExporter';
import { t } from '../../src/i18n';
import { LogLine } from '../../src/types';
import {
  colors,
  spacing,
  typography,
  borderRadius,
  layout,
  animation,
} from '../../src/constants/theme';

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

function formatUptime(connectedAt: Date | null): string {
  if (!connectedAt) return '';
  const diffMs = new Date().getTime() - new Date(connectedAt).getTime();
  const totalSecs = Math.floor(diffMs / 1000);
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
}

function parseNumbers(text: string): number[] {
  const numbers: number[] = [];
  const kvMatches = text.match(/[\w]+:\s*(-?\d+\.?\d*)/g);
  if (kvMatches && kvMatches.length > 0) {
    for (const kv of kvMatches) {
      const val = parseFloat(kv.split(':')[1]);
      if (!isNaN(val) && isFinite(val)) numbers.push(val);
    }
    return numbers;
  }
  const parts = text.split(/[,\s\t|]+/);
  for (const part of parts) {
    const val = parseFloat(part.trim());
    if (!isNaN(val) && isFinite(val)) numbers.push(val);
  }
  return numbers;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatusDot() {
  const opacity = useSharedValue(1);
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: animation.statusPulse.duration / 2, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: animation.statusPulse.duration / 2, easing: Easing.inOut(Easing.ease) }),
      ), -1, false,
    );
  }, []);
  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View style={[styles.statusDot, animStyle]}>
      <View style={styles.statusDotInner} />
    </Animated.View>
  );
}

const LogLineRow = React.memo(
  ({ item, showTimestamp }: { item: LogLine; showTimestamp: boolean }) => {
    const lineColor = getLineColor(item.text);
    const handleLongPress = useCallback(async () => {
      const copyText = showTimestamp
        ? `${formatTimestamp(item.timestamp)} ${item.text}`
        : item.text;
      await Clipboard.setStringAsync(copyText);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, [item, showTimestamp]);
    return (
      <Pressable onLongPress={handleLongPress} style={styles.logLine}>
        {showTimestamp && <Text style={styles.logTimestamp}>{formatTimestamp(item.timestamp)}</Text>}
        <Text style={[styles.logText, { color: lineColor }]} selectable>{item.text}</Text>
      </Pressable>
    );
  },
);

function BlinkingCursor() {
  const opacity = useSharedValue(1);
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: animation.statusBlink.duration, easing: Easing.steps(1, true) }),
        withTiming(1, { duration: animation.statusBlink.duration, easing: Easing.steps(1, true) }),
      ), -1, false,
    );
  }, []);
  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <View style={styles.cursorRow}>
      <Text style={styles.cursorPrompt}>&gt; </Text>
      <Animated.Text style={[styles.cursorBlock, animStyle]}>{'\u2588'}</Animated.Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Plotter constants
// ---------------------------------------------------------------------------

const CHART_COLORS = ['#00d2ff', '#4caf50', '#ff9800', '#e91e63', '#9c27b0', '#ffeb3b'];
const MAX_POINTS = 100;

interface DataSeries { values: number[]; label: string; color: string; }

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function MonitorTabScreen() {
  const flatListRef = useRef<FlatList>(null);
  const [commandText, setCommandText] = useState('');
  const [mode, setMode] = useState<'monitor' | 'plotter'>('monitor');

  const status = useConnectionStore((s) => s.status);
  const currentDevice = useConnectionStore((s) => s.currentDevice);
  const sendCommand = useConnectionStore((s) => s.sendCommand);
  const connectionType = useConnectionStore((s) => s.connectionType);
  const connectedAt = useConnectionStore((s) => s.connectedAt);

  const lines = useLogStore((s) => s.lines);
  const isPaused = useLogStore((s) => s.isPaused);
  const filter = useLogStore((s) => s.filter);
  const clear = useLogStore((s) => s.clear);
  const togglePause = useLogStore((s) => s.togglePause);
  const getFilteredLines = useLogStore((s) => s.getFilteredLines);

  const autoScroll = useSettingsStore((s) => s.autoScroll);
  const showTimestamp = useSettingsStore((s) => s.showTimestamp);

  const filteredLines = useMemo(() => getFilteredLines(), [lines, filter]);
  const isConnected = status === 'connected';
  const [uptimeStr, setUptimeStr] = useState('');

  // Plotter state
  const [plotterSeries, setPlotterSeries] = useState<DataSeries[]>([]);
  const lastLineIdRef = useRef(0);
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - layout.screenPaddingH * 2 - 32;
  const chartHeight = 220;
  const chartPadding = { top: 16, right: 12, bottom: 24, left: 45 };
  const plotWidth = chartWidth - chartPadding.left - chartPadding.right;
  const plotHeight = chartHeight - chartPadding.top - chartPadding.bottom;

  useEffect(() => {
    if (autoScroll && !isPaused && filteredLines.length > 0 && mode === 'monitor') {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }, [filteredLines.length, autoScroll, isPaused, mode]);

  useEffect(() => {
    if (!isConnected || !connectedAt) { setUptimeStr(''); return; }
    const interval = setInterval(() => setUptimeStr(formatUptime(connectedAt)), 1000);
    setUptimeStr(formatUptime(connectedAt));
    return () => clearInterval(interval);
  }, [isConnected, connectedAt]);

  useEffect(() => {
    if (mode !== 'plotter' || isPaused || lines.length === 0) return;
    const newLines = lines.filter((l) => l.id > lastLineIdRef.current);
    if (newLines.length === 0) return;
    lastLineIdRef.current = lines[lines.length - 1].id;
    setPlotterSeries((prev) => {
      const updated = prev.map((s) => ({ ...s, values: [...s.values] }));
      for (const line of newLines) {
        const nums = parseNumbers(line.text);
        if (nums.length === 0) continue;
        while (updated.length < nums.length) {
          const idx = updated.length;
          updated.push({ values: [], label: `CH${idx + 1}`, color: CHART_COLORS[idx % CHART_COLORS.length] });
        }
        for (let i = 0; i < nums.length; i++) {
          updated[i].values.push(nums[i]);
          if (updated[i].values.length > MAX_POINTS) updated[i].values.shift();
        }
      }
      return updated;
    });
  }, [lines, mode, isPaused]);

  const handleClear = useCallback(() => {
    Alert.alert(t('monitor_clear_title'), t('monitor_clear_msg'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('monitor_clear'), style: 'destructive', onPress: () => { clear(); setPlotterSeries([]); } },
    ]);
  }, [clear]);

  const handleExport = useCallback(async () => {
    try { await exportLogToText(filteredLines); } catch { Alert.alert(t('monitor_export_error'), t('monitor_export_error_msg')); }
  }, [filteredLines]);

  const handleSend = useCallback(() => {
    const trimmed = commandText.trim();
    if (!trimmed) return;
    sendCommand(trimmed);
    setCommandText('');
    Keyboard.dismiss();
  }, [commandText, sendCommand]);

  const renderLogLine = useCallback(
    ({ item }: { item: LogLine }) => <LogLineRow item={item} showTimestamp={showTimestamp} />,
    [showTimestamp],
  );
  const keyExtractor = useCallback((item: LogLine) => String(item.id), []);

  const allValues = plotterSeries.flatMap((s) => s.values);
  let yMin = 0, yMax = 1;
  if (allValues.length > 0) {
    yMin = Math.min(...allValues); yMax = Math.max(...allValues);
    if (yMin === yMax) { yMin -= 1; yMax += 1; }
    const pad = (yMax - yMin) * 0.1; yMin -= pad; yMax += pad;
  }
  const hasPlotData = plotterSeries.some((s) => s.values.length > 1);
  const yLabels = Array.from({ length: 5 }, (_, i) => ({
    val: yMin + ((yMax - yMin) * i) / 4,
    y: chartPadding.top + plotHeight - (plotHeight * i) / 4,
  }));

  if (!isConnected) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyContainer}>
          <Feather name="wifi-off" size={40} color={colors.text.muted} />
          <Text style={styles.emptyTitle}>{t('home_no_connection')}</Text>
          <Text style={styles.emptySubtext}>{t('macros_not_connected')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {isConnected && <StatusDot />}
            <Text style={styles.headerDevice} numberOfLines={1}>{currentDevice?.name ?? 'Device'}</Text>
            {uptimeStr ? <Text style={styles.headerUptime}>{uptimeStr}</Text> : null}
          </View>
          <View style={styles.modeToggle}>
            <Pressable style={[styles.modeBtn, mode === 'monitor' && styles.modeBtnActive]} onPress={() => setMode('monitor')}>
              <Feather name="terminal" size={16} color={mode === 'monitor' ? colors.accent.primary : colors.text.muted} />
            </Pressable>
            <Pressable style={[styles.modeBtn, mode === 'plotter' && styles.modeBtnActive]} onPress={() => setMode('plotter')}>
              <Feather name="trending-up" size={16} color={mode === 'plotter' ? colors.accent.primary : colors.text.muted} />
            </Pressable>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <NeuButton icon="trash-2" onPress={handleClear} size={layout.actionButtonSize} />
          <NeuButton icon="share" onPress={handleExport} size={layout.actionButtonSize} />
          <NeuButton icon={isPaused ? 'play' : 'pause'} onPress={togglePause} active={isPaused} size={layout.actionButtonSize} />
          <NeuButton icon="clock" onPress={() => useSettingsStore.getState().updateSetting('showTimestamp', !showTimestamp)} active={showTimestamp} size={layout.actionButtonSize} />
          <NeuButton icon={autoScroll ? 'chevrons-down' : 'minus'} onPress={() => useSettingsStore.getState().updateSetting('autoScroll', !autoScroll)} active={autoScroll} size={layout.actionButtonSize} />
        </View>

        {/* Content */}
        {mode === 'monitor' ? (
          <NeuContainer style={styles.terminalContainer}>
            <View style={styles.metaBar}>
              <Text style={styles.metaText}>{connectionType === 'ble' ? 'BLE' : 'WiFi'} {'\u2022'} {currentDevice?.host ?? '\u2014'}:{currentDevice?.port ?? '\u2014'}</Text>
              <Text style={styles.metaText}>{t('monitor_lines')(filteredLines.length)}</Text>
            </View>
            <FlatList ref={flatListRef} data={filteredLines} renderItem={renderLogLine} keyExtractor={keyExtractor} style={styles.logList} contentContainerStyle={styles.logListContent} showsVerticalScrollIndicator={true} ListFooterComponent={<BlinkingCursor />} />
          </NeuContainer>
        ) : (
          <View style={styles.plotterContainer}>
            {!hasPlotData ? (
              <View style={styles.plotterEmpty}>
                <Feather name="trending-up" size={32} color={colors.text.muted} />
                <Text style={styles.plotterEmptyText}>{t('plotter_empty')}</Text>
                <Text style={styles.plotterHint}>{t('plotter_hint')}</Text>
              </View>
            ) : (
              <>
                <Svg width={chartWidth} height={chartHeight}>
                  {yLabels.map((l, i) => (
                    <React.Fragment key={i}>
                      <Line x1={chartPadding.left} y1={l.y} x2={chartPadding.left + plotWidth} y2={l.y} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
                      <SvgText x={chartPadding.left - 8} y={l.y + 4} fill={colors.text.muted} fontSize={10} fontFamily="Menlo" textAnchor="end">{l.val.toFixed(l.val % 1 === 0 ? 0 : 1)}</SvgText>
                    </React.Fragment>
                  ))}
                  {plotterSeries.map((s, si) => {
                    if (s.values.length < 2) return null;
                    const points = s.values.map((val, i) => {
                      const x = chartPadding.left + (plotWidth * i) / (s.values.length - 1);
                      const y = chartPadding.top + plotHeight - ((val - yMin) / (yMax - yMin)) * plotHeight;
                      return `${x},${y}`;
                    }).join(' ');
                    return <Polyline key={si} points={points} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />;
                  })}
                </Svg>
                <View style={styles.legend}>
                  {plotterSeries.map((s, i) => (
                    <View key={i} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: s.color }]} />
                      <Text style={styles.legendLabel}>{s.label}</Text>
                      <Text style={styles.legendValue}>{s.values.length > 0 ? s.values[s.values.length - 1].toFixed(1) : '\u2014'}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        )}

        {/* Command Input */}
        <View style={styles.inputRow}>
          <NeuInput icon="terminal" placeholder={t('monitor_send_placeholder')} value={commandText} onChangeText={setCommandText} onSubmitEditing={handleSend} returnKeyType="send" autoCapitalize="none" autoCorrect={false} containerStyle={styles.inputWrapper} style={styles.inputMono} />
          <NeuButton icon="send" onPress={handleSend} size={56} variant="accent" disabled={!isConnected || commandText.trim().length === 0} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg.primary },
  flex: { flex: 1 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  emptyTitle: { ...typography.body, color: colors.text.secondary, fontWeight: '600' },
  emptySubtext: { ...typography.caption, color: colors.text.muted },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: layout.screenPaddingH, paddingVertical: spacing.sm, height: layout.headerHeight },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  headerDevice: { ...typography.bodySmall, color: colors.text.primary, fontWeight: '700' },
  headerUptime: { ...typography.caption, color: colors.text.muted, fontFamily: 'Menlo' },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.status.connectedGlow, alignItems: 'center', justifyContent: 'center' },
  statusDotInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.status.connected },
  modeToggle: { flexDirection: 'row', backgroundColor: colors.bg.surfaceLight, borderRadius: 10, padding: 2 },
  modeBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  modeBtnActive: { backgroundColor: colors.bg.surface },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', paddingVertical: 4, paddingHorizontal: layout.screenPaddingH },
  terminalContainer: { flex: 1, marginHorizontal: layout.screenPaddingH, marginTop: spacing.xs, padding: spacing.md },
  metaBar: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  metaText: { fontFamily: 'Menlo', fontSize: 10, color: colors.text.primary, opacity: 0.3 },
  logList: { flex: 1 },
  logListContent: { paddingBottom: spacing.sm },
  logLine: { flexDirection: 'row', paddingVertical: 3, gap: spacing.sm },
  logTimestamp: { ...typography.logTimestamp, color: colors.log.info },
  logText: { ...typography.logText, flex: 1, color: colors.text.primary },
  cursorRow: { flexDirection: 'row', paddingTop: spacing.xs, alignItems: 'center' },
  cursorPrompt: { fontFamily: 'Menlo', fontSize: 13, color: colors.accent.primary },
  cursorBlock: { fontFamily: 'Menlo', fontSize: 13, color: colors.accent.primary },
  plotterContainer: { flex: 1, marginHorizontal: layout.screenPaddingH, marginTop: spacing.xs, backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, borderWidth: 1, borderColor: colors.borderLight, padding: spacing.md, alignItems: 'center', justifyContent: 'center' },
  plotterEmpty: { alignItems: 'center', gap: spacing.sm },
  plotterEmptyText: { ...typography.body, color: colors.text.secondary, fontWeight: '600' },
  plotterHint: { ...typography.caption, color: colors.text.muted, textAlign: 'center', paddingHorizontal: spacing.lg },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.bg.surfaceLight, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { ...typography.caption, color: colors.text.secondary, fontWeight: '600' },
  legendValue: { fontFamily: 'Menlo', fontSize: 12, color: colors.text.primary },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: layout.screenPaddingH, paddingBottom: spacing.md, paddingTop: spacing.sm, gap: spacing.sm, marginBottom: 80 },
  inputWrapper: { flex: 1 },
  inputMono: { fontFamily: 'Menlo', fontSize: 14 },
});
