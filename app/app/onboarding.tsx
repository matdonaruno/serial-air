import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Dimensions,
  StyleSheet,
  Pressable,
  ListRenderItemInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius, typography, neuShadow } from '../src/constants/theme';
import { useAppStore } from '../src/stores/useAppStore';
import { t } from '../src/i18n';

type FeatherIconName = React.ComponentProps<typeof Feather>['name'];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Slide {
  icon: FeatherIconName;
  title: string;
  subtitle: string;
  description: string;
}

function getSlides(): Slide[] {
  return [
    { icon: 'wifi', title: t('onboarding_slide1_title'), subtitle: t('onboarding_slide1_subtitle'), description: t('onboarding_slide1_desc') },
    { icon: 'code', title: t('onboarding_slide2_title'), subtitle: t('onboarding_slide2_subtitle'), description: t('onboarding_slide2_desc') },
    { icon: 'search', title: t('onboarding_slide3_title'), subtitle: t('onboarding_slide3_subtitle'), description: t('onboarding_slide3_desc') },
    { icon: 'zap', title: t('onboarding_slide4_title'), subtitle: t('onboarding_slide4_subtitle'), description: t('onboarding_slide4_desc') },
    { icon: 'terminal', title: t('onboarding_slide5_title'), subtitle: t('onboarding_slide5_subtitle'), description: t('onboarding_slide5_desc') },
    { icon: 'send', title: t('onboarding_slide6_title'), subtitle: t('onboarding_slide6_subtitle'), description: t('onboarding_slide6_desc') },
    { icon: 'download', title: t('onboarding_slide7_title'), subtitle: t('onboarding_slide7_subtitle'), description: t('onboarding_slide7_desc') },
  ];
}

export default function OnboardingScreen() {
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const slides = getSlides();

  const isLast = currentIndex === slides.length - 1;

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isLast) {
      completeOnboarding();
      router.replace('/' as any);
    } else {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    completeOnboarding();
    router.replace('/' as any);
  };

  const renderSlide = ({ item }: ListRenderItemInfo<Slide>) => (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      <View style={styles.iconCircle}>
        <Feather name={item.icon} size={40} color={colors.accent.primary} />
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.subtitle}>{item.subtitle}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );

  return (
    <View style={styles.containerOuter}>
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={handleSkip} hitSlop={12}>
          <Text style={styles.skipText}>{t('onboarding_skip')}</Text>
        </Pressable>
      </View>

      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(
            e.nativeEvent.contentOffset.x / SCREEN_WIDTH
          );
          setCurrentIndex(index);
        }}
      />

      {/* Dots */}
      <View style={styles.dotsRow}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === currentIndex && styles.dotActive,
            ]}
          />
        ))}
      </View>

      {/* Next / Get Started button */}
      <View style={styles.bottomRow}>
        <Pressable style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>
            {isLast ? t('onboarding_get_started') : t('onboarding_next')}
          </Text>
          <Feather
            name={isLast ? 'check' : 'arrow-right'}
            size={18}
            color={colors.white}
          />
        </Pressable>
      </View>
    </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  containerOuter: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  skipText: {
    ...typography.bodySmall,
    color: colors.text.muted,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    ...neuShadow.raised,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  title: {
    ...typography.titleMedium,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.accent.primary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: '600',
  },
  description: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginBottom: spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.bg.surfaceLight,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.accent.primary,
    shadowColor: colors.accent.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  bottomRow: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent.primary,
    borderRadius: borderRadius.innerCard,
    paddingVertical: 16,
    shadowColor: colors.accent.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  nextButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
