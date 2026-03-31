import React, { useEffect } from 'react';
import { View, StyleSheet, Image, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { colors } from '../constants/theme';

interface AnimatedSplashProps {
  onFinish: () => void;
}

export function AnimatedSplash({ onFinish }: AnimatedSplashProps) {
  const opacity = useSharedValue(0);
  const iconScale = useSharedValue(1);
  const iconTranslateY = useSharedValue(0);

  useEffect(() => {
    // Phase 1: Fade in (0 → 600ms)
    opacity.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });

    // Phase 2: "Surprised jump" after fade-in completes (800ms delay)
    iconTranslateY.value = withDelay(
      800,
      withSequence(
        // Quick jump up
        withTiming(-18, { duration: 100, easing: Easing.out(Easing.cubic) }),
        // Bounce back down with spring
        withSpring(0, { damping: 4, stiffness: 300, mass: 0.6 }),
      ),
    );

    iconScale.value = withDelay(
      800,
      withSequence(
        // Squash slightly on "surprise"
        withTiming(1.08, { duration: 80 }),
        withTiming(0.95, { duration: 80 }),
        withSpring(1, { damping: 6, stiffness: 200 }),
      ),
    );

    // Finish after animation completes
    const timer = setTimeout(() => {
      onFinish();
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: iconTranslateY.value },
      { scale: iconScale.value },
    ],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, containerStyle]}>
        <Animated.View style={iconStyle}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.icon}
          />
        </Animated.View>
        <Text style={styles.title}>Serial Air</Text>
        <Text style={styles.subtitle}>Wireless Serial Monitor</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.bg.primary,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  content: {
    alignItems: 'center',
  },
  icon: {
    width: 120,
    height: 120,
    borderRadius: 28,
    marginBottom: 24,
  },
  title: {
    fontSize: 42,
    fontWeight: '700',
    color: colors.accent.primary,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '400',
    color: colors.text.secondary,
    marginTop: 8,
  },
});
