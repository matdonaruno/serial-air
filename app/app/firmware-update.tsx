import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
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

import { NeuButton, NeuCard, NeuContainer } from '../src/components/neumorphic';
import {
  colors,
  spacing,
  typography,
  borderRadius,
  layout,
  animation,
  neuShadow,
} from '../src/constants/theme';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_PROGRESS = 0.65; // 65%
const MOCK_VERSION = 'v2.4.0';
const MOCK_DOWNLOADED = '4.2MB';
const MOCK_TOTAL = '6.5MB';

interface UpdateStep {
  label: string;
  status: 'completed' | 'current' | 'pending';
}

const MOCK_STEPS: UpdateStep[] = [
  { label: 'Checking compatibility', status: 'completed' },
  { label: 'Downloading firmware', status: 'completed' },
  { label: 'Verifying package integrity', status: 'current' },
  { label: 'Flashing firmware', status: 'pending' },
  { label: 'Rebooting device', status: 'pending' },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Pulsing download icon circle */
function PulsingIconCircle() {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, {
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
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.iconCircle, animStyle]}>
      <Feather name="download" size={32} color={colors.accent.primary} />
    </Animated.View>
  );
}

/** A single step in the update process */
function StepRow({ step }: { step: UpdateStep }) {
  const isCompleted = step.status === 'completed';
  const isCurrent = step.status === 'current';

  const iconName: React.ComponentProps<typeof Feather>['name'] = isCompleted
    ? 'check'
    : isCurrent
    ? 'arrow-right'
    : 'circle';

  const iconColor = isCompleted
    ? colors.log.success
    : isCurrent
    ? colors.accent.primary
    : colors.text.muted;

  const textColor = isCompleted
    ? colors.log.success
    : isCurrent
    ? colors.accent.primary
    : colors.text.muted;

  const rowOpacity = isCompleted ? 0.5 : step.status === 'pending' ? 0.4 : 1;

  return (
    <View style={[styles.stepRow, { opacity: rowOpacity }]}>
      <Feather name={iconName} size={16} color={iconColor} />
      <Text style={[styles.stepText, { color: textColor }]}>{step.label}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function FirmwareUpdateScreen() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const handleCancel = () => {
    router.back();
  };

  const progressPercent = Math.round(MOCK_PROGRESS * 100);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ============================================================ */}
      {/* Header                                                        */}
      {/* ============================================================ */}
      <View style={styles.header}>
        <NeuButton icon="arrow-left" onPress={handleBack} size={layout.actionButtonSize} />
        <Text style={styles.headerTitle}>FIRMWARE UPDATE</Text>
        <View style={{ width: layout.actionButtonSize }} />
      </View>

      {/* ============================================================ */}
      {/* Main Card                                                     */}
      {/* ============================================================ */}
      <View style={styles.bodyContainer}>
        <NeuCard style={styles.mainCard}>
          {/* Pulsing icon */}
          <View style={styles.iconWrapper}>
            <PulsingIconCircle />
          </View>

          {/* Title */}
          <Text style={styles.updateTitle}>Updating to {MOCK_VERSION}...</Text>

          {/* Subtitle */}
          <Text style={styles.updateSubtitle}>
            Downloading package: {MOCK_DOWNLOADED} / {MOCK_TOTAL}
          </Text>

          {/* Progress bar */}
          <View style={styles.progressSection}>
            <NeuContainer style={styles.progressBarOuter}>
              <View
                style={[
                  styles.progressBarInner,
                  { width: `${progressPercent}%` },
                ]}
              />
            </NeuContainer>

            {/* Progress labels */}
            <View style={styles.progressLabels}>
              <Text style={styles.progressLabelMuted}>0%</Text>
              <Text style={styles.progressLabelAccent}>{progressPercent}%</Text>
              <Text style={styles.progressLabelMuted}>100%</Text>
            </View>
          </View>

          {/* Status steps */}
          <NeuContainer style={styles.stepsContainer}>
            {MOCK_STEPS.map((step, index) => (
              <StepRow key={index} step={step} />
            ))}
          </NeuContainer>
        </NeuCard>

        {/* ============================================================ */}
        {/* Warning Text                                                  */}
        {/* ============================================================ */}
        <Text style={styles.warningText}>
          Please keep your device powered on and within Bluetooth range during
          the update process. Interrupting the update may damage the firmware.
        </Text>

        {/* ============================================================ */}
        {/* Cancel Button                                                 */}
        {/* ============================================================ */}
        <NeuCard onPress={handleCancel} style={styles.cancelCard}>
          <Text style={styles.cancelText}>CANCEL UPDATE</Text>
        </NeuCard>
      </View>
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

  // Body
  bodyContainer: {
    flex: 1,
    paddingHorizontal: layout.screenPaddingH,
    justifyContent: 'center',
  },

  // Main card
  mainCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },

  // Pulsing icon
  iconWrapper: {
    marginBottom: spacing.lg,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...neuShadow.raised,
  },

  // Title / subtitle
  updateTitle: {
    ...typography.titleSmall,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  updateSubtitle: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },

  // Progress bar
  progressSection: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  progressBarOuter: {
    height: 24,
    borderRadius: borderRadius.full,
    padding: 4,
    overflow: 'hidden',
  },
  progressBarInner: {
    height: '100%',
    backgroundColor: colors.accent.primary,
    borderRadius: borderRadius.full,
    shadowColor: colors.accent.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  progressLabelMuted: {
    fontFamily: 'Menlo',
    fontSize: 11,
    color: colors.text.muted,
  },
  progressLabelAccent: {
    fontFamily: 'Menlo',
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent.primary,
  },

  // Steps
  stepsContainer: {
    width: '100%',
    padding: spacing.md,
    gap: spacing.sm,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepText: {
    ...typography.bodySmall,
    flex: 1,
  },

  // Warning
  warningText: {
    ...typography.caption,
    color: colors.text.muted,
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    lineHeight: 18,
  },

  // Cancel button
  cancelCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.danger,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
});
