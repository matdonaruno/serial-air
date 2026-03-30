import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { colors, spacing, borderRadius, typography } from '../constants/theme';

type FeatherIconName = React.ComponentProps<typeof Feather>['name'];

interface CoachStep {
  icon: FeatherIconName;
  title: string;
  description: string;
}

interface CoachMarkProps {
  id: string; // unique key for AsyncStorage
  steps: CoachStep[];
  dismissLabel?: string;
}

const STORAGE_PREFIX = 'serial-air:coach:';

export function CoachMark({ id, steps, dismissLabel = 'OK' }: CoachMarkProps) {
  const [visible, setVisible] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_PREFIX + id).then((val) => {
      if (!val) setVisible(true);
    });
  }, [id]);

  const handleNext = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      setVisible(false);
      AsyncStorage.setItem(STORAGE_PREFIX + id, 'done').catch(() => {});
    }
  };

  if (!visible || steps.length === 0) return null;

  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;

  return (
    <Modal transparent visible animationType="fade">
      <Pressable style={styles.overlay} onPress={handleNext}>
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(200)}
          style={styles.card}
        >
          <View style={styles.iconCircle}>
            <Feather name={step.icon} size={28} color={colors.accent.primary} />
          </View>
          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.description}>{step.description}</Text>

          {/* Progress dots */}
          {steps.length > 1 && (
            <View style={styles.dotsRow}>
              {steps.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, i === stepIndex && styles.dotActive]}
                />
              ))}
            </View>
          )}

          <Pressable style={styles.button} onPress={handleNext}>
            <Text style={styles.buttonText}>
              {isLast ? dismissLabel : 'Next'}
            </Text>
            <Feather
              name={isLast ? 'check' : 'arrow-right'}
              size={16}
              color={colors.bg.primary}
            />
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

// Reset all coach marks (for testing)
export async function resetCoachMarks() {
  const keys = await AsyncStorage.getAllKeys();
  const coachKeys = keys.filter((k) => k.startsWith(STORAGE_PREFIX));
  if (coachKeys.length > 0) {
    await AsyncStorage.multiRemove(coachKeys);
  }
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.bg.surface,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.bg.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.titleSmall,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.lg,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.bg.surfaceLight,
  },
  dotActive: {
    width: 18,
    backgroundColor: colors.accent.primary,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.accent.primary,
    borderRadius: borderRadius.innerCard,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  buttonText: {
    ...typography.bodySmall,
    color: colors.bg.primary,
    fontWeight: '700',
  },
});
