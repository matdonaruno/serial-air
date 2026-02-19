import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { colors } from '../../constants/theme';

interface NeuToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

export function NeuToggle({ value, onValueChange, disabled }: NeuToggleProps) {
  const trackStyle = useAnimatedStyle(() => {
    const bg = interpolateColor(
      withTiming(value ? 1 : 0, { duration: 200 }),
      [0, 1],
      [colors.bg.debossed, colors.accent.primary]
    );
    return { backgroundColor: bg };
  });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: withTiming(value ? 22 : 0, { duration: 200 }) },
    ],
    backgroundColor: value ? colors.white : colors.text.muted,
  }));

  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      disabled={disabled}
      style={[disabled && styles.disabled]}
    >
      <Animated.View style={[styles.track, trackStyle]}>
        <Animated.View style={[styles.thumb, thumbStyle]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 50,
    height: 28,
    borderRadius: 14,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.shadow.innerDark,
  },
  thumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  disabled: {
    opacity: 0.5,
  },
});
