import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { NeuButton } from '../../src/components/neumorphic';
import { useConnectionStore } from '../../src/stores/useConnectionStore';
import {
  colors,
  spacing,
  typography,
  layout,
  neuShadow,
} from '../../src/constants/theme';

export default function TerminalScreen() {
  const router = useRouter();
  const status = useConnectionStore((s) => s.status);

  // If connected, redirect to the full monitor screen
  useEffect(() => {
    if (status === 'connected') {
      router.replace('/monitor');
    }
  }, [status, router]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Empty-state content */}
        <View style={styles.iconCircle}>
          <Feather
            name="terminal"
            size={36}
            color={colors.text.muted}
          />
        </View>

        <Text style={styles.title}>No Active Session</Text>
        <Text style={styles.subtitle}>
          Connect to a device from the Home tab
        </Text>

        <NeuButton
          icon="home"
          label="Home"
          onPress={() => router.replace('/(tabs)/')}
          size={layout.actionButtonLarge}
          style={styles.homeButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: layout.screenPaddingH,
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
    ...typography.titleSmall,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.text.muted,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  homeButton: {
    marginTop: spacing.md,
  },
});
