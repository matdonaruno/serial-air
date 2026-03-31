import React from 'react';
import {
  Pressable,
  Text,
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, neuShadow, animation, typography } from '../../constants/theme';

type FeatherIconName = React.ComponentProps<typeof Feather>['name'];

interface NeuButtonProps {
  icon: FeatherIconName;
  label?: string;
  onPress: () => void;
  size?: number;
  variant?: 'default' | 'accent' | 'danger';
  active?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function NeuButton({
  icon,
  label,
  onPress,
  size = 40,
  variant = 'default',
  active,
  disabled,
  style,
}: NeuButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withTiming(animation.buttonPress.scale, {
      duration: animation.buttonPress.duration,
    });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, {
      duration: animation.buttonPress.duration,
    });
  };

  const isAccent = variant === 'accent';
  const isDanger = variant === 'danger';

  const buttonBg = isAccent
    ? colors.accent.primary
    : colors.bg.primary;

  const iconColor = isAccent
    ? colors.white
    : isDanger
    ? colors.danger
    : active
    ? colors.accent.primary
    : colors.text.dim;

  const shadowStyle = isAccent
    ? {
        shadowColor: colors.accent.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 6,
      }
    : neuShadow.button;

  return (
    <View style={[styles.wrapper, style]}>
      <AnimatedPressable
        style={[
          styles.button,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: buttonBg,
          },
          shadowStyle,
          active && !isAccent && styles.buttonActive,
          disabled && styles.buttonDisabled,
          animatedStyle,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
      >
        <Feather
          name={icon}
          size={size * 0.45}
          color={iconColor}
        />
      </AnimatedPressable>
      {label && (
        <Text
          style={[
            styles.label,
            { color: active ? colors.accent.primary : colors.text.muted },
          ]}
        >
          {label}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: 4,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  buttonActive: {
    backgroundColor: colors.bg.debossed,
    borderColor: colors.shadow.innerDark,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  label: {
    ...typography.buttonLabel,
    marginTop: 2,
  },
});
