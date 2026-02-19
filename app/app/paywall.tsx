import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius, typography, neuShadow } from '../src/constants/theme';
import { usePurchaseStore } from '../src/stores/usePurchaseStore';

type FeatherIconName = React.ComponentProps<typeof Feather>['name'];

interface FeatureItem {
  icon: FeatherIconName;
  text: string;
}

const features: FeatureItem[] = [
  { icon: 'wifi', text: 'Unlimited connections' },
  { icon: 'clock', text: 'No time restrictions' },
  { icon: 'refresh-cw', text: 'All future updates' },
  { icon: 'shield', text: 'No ads, no tracking' },
  { icon: 'terminal', text: 'Full terminal features' },
  { icon: 'download', text: 'Log export & sharing' },
];

export default function PaywallScreen() {
  const isPurchasing = usePurchaseStore((s) => s.isPurchasing);
  const isRestoring = usePurchaseStore((s) => s.isRestoring);
  const trialDaysRemaining = usePurchaseStore((s) => s.trialDaysRemaining);
  const error = usePurchaseStore((s) => s.error);
  const purchase = usePurchaseStore((s) => s.purchase);
  const restore = usePurchaseStore((s) => s.restore);

  const handlePurchase = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const success = await purchase();
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    }
  };

  const handleRestore = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const success = await restore();
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Close button */}
      <View style={styles.header}>
        <Pressable onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.back();
        }} hitSlop={12}>
          <View style={styles.closeButton}>
            <Feather name="x" size={20} color={colors.text.secondary} />
          </View>
        </Pressable>
      </View>

      {/* Icon */}
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Feather name="zap" size={36} color={colors.accent.primary} />
        </View>

        <Text style={styles.title}>Unlock Serial Air</Text>
        <Text style={styles.subtitle}>One-time purchase. Yours forever.</Text>

        {/* Trial badge */}
        {trialDaysRemaining > 0 ? (
          <View style={styles.trialBadge}>
            <Feather name="clock" size={14} color={colors.accent.primary} />
            <Text style={styles.trialBadgeText}>
              {trialDaysRemaining} day{trialDaysRemaining !== 1 ? 's' : ''} left in trial
            </Text>
          </View>
        ) : (
          <View style={[styles.trialBadge, styles.trialExpired]}>
            <Feather name="alert-circle" size={14} color={colors.status.disconnected} />
            <Text style={[styles.trialBadgeText, { color: colors.status.disconnected }]}>
              Trial expired
            </Text>
          </View>
        )}

        {/* Features */}
        <View style={styles.featuresCard}>
          {features.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.featureIconCircle}>
                <Feather name={f.icon} size={16} color={colors.accent.primary} />
              </View>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>

        {/* Price */}
        <View style={styles.priceContainer}>
          <Text style={styles.price}>$1.99</Text>
          <Text style={styles.priceLabel}>One-time purchase</Text>
        </View>

        {/* Error */}
        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
      </View>

      {/* Buttons */}
      <View style={styles.bottomSection}>
        <Pressable
          style={[styles.purchaseButton, isPurchasing && styles.buttonDisabled]}
          onPress={handlePurchase}
          disabled={isPurchasing || isRestoring}
        >
          {isPurchasing ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <>
              <Text style={styles.purchaseButtonText}>Purchase — $1.99</Text>
              <Feather name="lock" size={16} color={colors.white} />
            </>
          )}
        </Pressable>

        <Pressable
          style={styles.restoreButton}
          onPress={handleRestore}
          disabled={isPurchasing || isRestoring}
        >
          {isRestoring ? (
            <ActivityIndicator color={colors.text.secondary} size="small" />
          ) : (
            <Text style={styles.restoreButtonText}>Restore Purchase</Text>
          )}
        </Pressable>

        <View style={styles.legalLinks}>
          <Pressable onPress={() => Linking.openURL('https://serialair.netlify.app/terms')}>
            <Text style={styles.legalText}>Terms</Text>
          </Pressable>
          <Text style={styles.legalDot}>&bull;</Text>
          <Pressable onPress={() => Linking.openURL('https://serialair.netlify.app/privacy')}>
            <Text style={styles.legalText}>Privacy</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...neuShadow.raised,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  title: {
    ...typography.titleMedium,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  trialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.bg.surface,
    borderRadius: borderRadius.button,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.accent.glow,
  },
  trialExpired: {
    borderColor: 'rgba(248, 113, 113, 0.3)',
  },
  trialBadgeText: {
    ...typography.caption,
    color: colors.accent.primary,
    fontWeight: '600',
  },
  featuresCard: {
    width: '100%',
    backgroundColor: colors.bg.surface,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...neuShadow.flat,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  featureIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bg.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureText: {
    ...typography.body,
    color: colors.text.primary,
    flex: 1,
  },
  priceContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  price: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: -1,
  },
  priceLabel: {
    ...typography.bodySmall,
    color: colors.text.muted,
    marginTop: 2,
  },
  errorText: {
    ...typography.caption,
    color: colors.status.disconnected,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  bottomSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  purchaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent.primary,
    borderRadius: borderRadius.innerCard,
    paddingVertical: 16,
    marginBottom: 12,
    shadowColor: colors.accent.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  purchaseButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 12,
  },
  restoreButtonText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  legalText: {
    ...typography.caption,
    color: colors.text.muted,
  },
  legalDot: {
    color: colors.text.muted,
    fontSize: 10,
  },
});
