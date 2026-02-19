import React from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors, borderRadius, neuShadow, animation } from '../../constants/theme';

interface NeuCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  active?: boolean;
  accentBorder?: boolean;
  disabled?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function NeuCard({
  children,
  style,
  onPress,
  active,
  accentBorder,
  disabled,
}: NeuCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(animation.cardTap.scale, {
      duration: animation.cardTap.duration,
    });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, {
      duration: animation.cardTap.duration,
    });
  };

  const cardStyle = [
    styles.card,
    neuShadow.raised,
    active && styles.cardActive,
    disabled && styles.cardDisabled,
    style,
  ];

  if (onPress) {
    return (
      <AnimatedPressable
        style={[cardStyle, animatedStyle]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
      >
        {accentBorder && <View style={styles.accentBorder} />}
        {children}
      </AnimatedPressable>
    );
  }

  return (
    <View style={cardStyle}>
      {accentBorder && <View style={styles.accentBorder} />}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.surface,
    borderRadius: borderRadius.cardLarge,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
  },
  cardActive: {
    backgroundColor: colors.bg.surfaceLight,
  },
  cardDisabled: {
    opacity: 0.6,
  },
  accentBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.accent.primary,
    shadowColor: colors.accent.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
});
