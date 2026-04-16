import React from 'react';
import { View, Text, Pressable, StyleSheet, Linking, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../constants/theme';

const APP_STORE_URL = Platform.select({
  ios: 'itms-apps://apps.apple.com/app/com.serialair.app',
  android: 'market://details?id=com.serialair.app',
  default: 'https://apps.apple.com/app/com.serialair.app',
});

interface Props {
  message?: string | null;
}

export function ForceUpdateScreen({ message }: Props) {
  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <View style={styles.iconCircle}>
          <Feather name="download" size={48} color={colors.accent.primary} />
        </View>

        <Text style={styles.title}>Update Required</Text>

        <Text style={styles.message}>
          {message || 'A new version of Serial Air is available. Please update to continue using the app.'}
        </Text>

        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={() => Linking.openURL(APP_STORE_URL!)}
        >
          <Feather name="external-link" size={18} color="#fff" />
          <Text style={styles.buttonText}>Update Now</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.bg.primary,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    paddingHorizontal: spacing.xl,
  },
  container: {
    alignItems: 'center',
    maxWidth: 320,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.bg.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.accent.glow,
  },
  title: {
    ...typography.headerTitle,
    color: colors.text.primary,
    fontSize: 24,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  message: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.accent.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: borderRadius.card,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    ...typography.body,
    color: '#fff',
    fontWeight: '700',
  },
});
