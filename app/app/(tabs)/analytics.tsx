import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Alert,
} from 'react-native';
import Svg, { Polyline, Line, Text as SvgText } from 'react-native-svg';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { NeuButton } from '../../src/components/neumorphic';
import { useConnectionStore } from '../../src/stores/useConnectionStore';
import { useLogStore } from '../../src/stores/useLogStore';
import { t } from '../../src/i18n';
import { CoachMark } from '../../src/components/CoachMark';
import {
  colors,
  spacing,
  typography,
  layout,
  borderRadius,
} from '../../src/constants/theme';

const MAX_POINTS = 100;
const CHART_COLORS = [
  '#00d2ff', // cyan
  '#4caf50', // green
  '#ff9800', // orange
  '#e91e63', // pink
  '#9c27b0', // purple
  '#ffeb3b', // yellow
];

// Parse numeric values from a serial line
// Supports: "25.5", "temp:25.5", "a:1 b:2 c:3", "1,2,3"
function parseNumbers(text: string): number[] {
  const numbers: number[] = [];
  // Try key:value pairs first
  const kvMatches = text.match(/[\w]+:\s*(-?\d+\.?\d*)/g);
  if (kvMatches && kvMatches.length > 0) {
    for (const kv of kvMatches) {
      const val = parseFloat(kv.split(':')[1]);
      if (!isNaN(val) && isFinite(val)) numbers.push(val);
    }
    return numbers;
  }
  // Try comma/space separated numbers
  const parts = text.split(/[,\s\t|]+/);
  for (const part of parts) {
    const val = parseFloat(part.trim());
    if (!isNaN(val) && isFinite(val)) numbers.push(val);
  }
  return numbers;
}

interface DataSeries {
  values: number[];
  label: string;
  color: string;
}

export default function AnalyticsScreen() {
  const status = useConnectionStore((s) => s.status);
  const currentDevice = useConnectionStore((s) => s.currentDevice);
  const lines = useLogStore((s) => s.lines);
  const [paused, setPaused] = useState(false);
  const [series, setSeries] = useState<DataSeries[]>([]);
  const lastLineIdRef = useRef(0);
  const chartRef = useRef<ViewShot>(null);
  const screenWidth = Dimensions.get('window').width;

  const isConnected = status === 'connected';
  const chartWidth = screenWidth - layout.screenPaddingH * 2 - 32;
  const chartHeight = 260;
  const chartPadding = { top: 20, right: 16, bottom: 30, left: 50 };
  const plotWidth = chartWidth - chartPadding.left - chartPadding.right;
  const plotHeight = chartHeight - chartPadding.top - chartPadding.bottom;

  // Process new log lines into data series
  useEffect(() => {
    if (paused || lines.length === 0) return;

    const newLines = lines.filter((l) => l.id > lastLineIdRef.current);
    if (newLines.length === 0) return;
    lastLineIdRef.current = lines[lines.length - 1].id;

    setSeries((prev) => {
      const updated = prev.map((s) => ({ ...s, values: [...s.values] }));

      for (const line of newLines) {
        const nums = parseNumbers(line.text);
        if (nums.length === 0) continue;

        // Ensure we have enough series
        while (updated.length < nums.length) {
          const idx = updated.length;
          updated.push({
            values: [],
            label: `CH${idx + 1}`,
            color: CHART_COLORS[idx % CHART_COLORS.length],
          });
        }

        // Push values
        for (let i = 0; i < nums.length; i++) {
          updated[i].values.push(nums[i]);
          if (updated[i].values.length > MAX_POINTS) {
            updated[i].values.shift();
          }
        }
      }

      return updated;
    });
  }, [lines, paused]);

  const handleExport = useCallback(async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const uri = await captureRef(chartRef, { format: 'png', quality: 1 });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Serial Air Plotter' });
    } catch {
      Alert.alert(t('plotter_export_error'));
    }
  }, []);

  const handleClear = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSeries([]);
    lastLineIdRef.current = lines.length > 0 ? lines[lines.length - 1].id : 0;
  }, [lines]);

  const handleTogglePause = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPaused((p) => !p);
  }, []);

  // Calculate chart bounds
  let yMin = 0;
  let yMax = 1;
  const allValues = series.flatMap((s) => s.values);
  if (allValues.length > 0) {
    yMin = Math.min(...allValues);
    yMax = Math.max(...allValues);
    if (yMin === yMax) {
      yMin -= 1;
      yMax += 1;
    }
    const padding = (yMax - yMin) * 0.1;
    yMin -= padding;
    yMax += padding;
  }

  const hasData = series.some((s) => s.values.length > 1);

  // Generate Y-axis labels
  const yLabels = Array.from({ length: 5 }, (_, i) => {
    const val = yMin + ((yMax - yMin) * i) / 4;
    return { val, y: chartPadding.top + plotHeight - (plotHeight * i) / 4 };
  });

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('plotter_title')}</Text>
        <View style={styles.headerActions}>
          <NeuButton
            icon="share"
            onPress={handleExport}
            size={layout.actionButtonSize}
            disabled={!hasData}
          />
          <NeuButton
            icon={paused ? 'play' : 'pause'}
            onPress={handleTogglePause}
            size={layout.actionButtonSize}
            active={paused}
          />
          <NeuButton
            icon="trash-2"
            onPress={handleClear}
            size={layout.actionButtonSize}
          />
        </View>
      </View>

      {/* Connection status */}
      <View style={[styles.statusBar, isConnected && styles.statusBarConnected]}>
        <View style={[styles.statusDot, { backgroundColor: isConnected ? colors.status.connected : colors.text.muted }]} />
        <Text style={[styles.statusText, { color: isConnected ? colors.status.connected : colors.text.muted }]}>
          {isConnected ? currentDevice?.name ?? 'Device' : t('plotter_empty_sub')}
        </Text>
        {paused && (
          <View style={styles.pausedBadge}>
            <Text style={styles.pausedText}>{t('plotter_pause')}</Text>
          </View>
        )}
      </View>

      {/* Chart */}
      <ViewShot ref={chartRef} options={{ format: 'png', quality: 1 }} style={styles.chartContainer}>
        {!hasData ? (
          <View style={styles.emptyContent}>
            <Feather name="activity" size={40} color={colors.text.muted} />
            <Text style={styles.emptyTitle}>{t('plotter_empty')}</Text>
            <Text style={styles.emptySubtext}>{t('plotter_hint')}</Text>
          </View>
        ) : (
          <Svg width={chartWidth} height={chartHeight}>
            {/* Grid lines */}
            {yLabels.map((l, i) => (
              <React.Fragment key={i}>
                <Line
                  x1={chartPadding.left}
                  y1={l.y}
                  x2={chartPadding.left + plotWidth}
                  y2={l.y}
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth={1}
                />
                <SvgText
                  x={chartPadding.left - 8}
                  y={l.y + 4}
                  fill={colors.text.muted}
                  fontSize={10}
                  fontFamily="Menlo"
                  textAnchor="end"
                >
                  {l.val.toFixed(l.val % 1 === 0 ? 0 : 1)}
                </SvgText>
              </React.Fragment>
            ))}

            {/* Data lines */}
            {series.map((s, si) => {
              if (s.values.length < 2) return null;
              const points = s.values
                .map((val, i) => {
                  const x = chartPadding.left + (plotWidth * i) / (s.values.length - 1);
                  const y = chartPadding.top + plotHeight - ((val - yMin) / (yMax - yMin)) * plotHeight;
                  return `${x},${y}`;
                })
                .join(' ');
              return (
                <Polyline
                  key={si}
                  points={points}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              );
            })}
          </Svg>
        )}
      </ViewShot>

      {/* Legend */}
      {hasData && (
        <View style={styles.legend}>
          {series.map((s, i) => (
            <View key={i} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: s.color }]} />
              <Text style={styles.legendLabel}>{s.label}</Text>
              <Text style={styles.legendValue}>
                {s.values.length > 0 ? s.values[s.values.length - 1].toFixed(1) : '—'}
              </Text>
            </View>
          ))}
        </View>
      )}

      <CoachMark
        id="plotter"
        steps={[
          { icon: 'activity', title: t('coach_plotter_1_title'), description: t('coach_plotter_1_desc') },
          { icon: 'hash', title: t('coach_plotter_2_title'), description: t('coach_plotter_2_desc') },
          { icon: 'share', title: t('coach_plotter_3_title'), description: t('coach_plotter_3_desc') },
        ]}
        dismissLabel={t('coach_ok')}
      />
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
    justifyContent: 'center',
    paddingHorizontal: layout.screenPaddingH,
    height: layout.headerHeight,
    position: 'relative',
  },
  headerTitle: {
    ...typography.headerTitle,
    color: colors.text.primary,
  },
  headerActions: {
    position: 'absolute',
    right: layout.screenPaddingH,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: layout.screenPaddingH,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: borderRadius.innerCard,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
    marginBottom: spacing.md,
  },
  statusBarConnected: {
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '600',
    flex: 1,
  },
  pausedBadge: {
    backgroundColor: 'rgba(255, 152, 0, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pausedText: {
    ...typography.caption,
    color: colors.status.connecting,
    fontWeight: '600',
    fontSize: 10,
  },
  chartContainer: {
    marginHorizontal: layout.screenPaddingH,
    backgroundColor: colors.bg.surface,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    minHeight: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContent: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
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
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: layout.screenPaddingH,
    marginTop: spacing.md,
    gap: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.surface,
    borderRadius: borderRadius.small,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  legendValue: {
    fontFamily: 'Menlo',
    fontSize: 12,
    color: colors.text.primary,
  },
});
