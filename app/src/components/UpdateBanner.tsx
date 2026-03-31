import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../constants/theme';
import { useAppStore } from '../stores/useAppStore';
import { fetchAndApplyUpdate } from '../services/UpdateService';

export function UpdateBanner() {
  const updateAvailable = useAppStore((s) => s.updateAvailable);
  const updateVersion = useAppStore((s) => s.updateVersion);
  const clearUpdate = useAppStore((s) => s.clearUpdate);

  if (!updateAvailable) return null;

  const handleUpdate = async () => {
    await fetchAndApplyUpdate();
  };

  return (
    <View style={styles.banner}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Feather name="download" size={16} color={colors.accent.primary} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Update Available</Text>
          {updateVersion && (
            <Text style={styles.version}>v{updateVersion}</Text>
          )}
        </View>
      </View>
      <View style={styles.actions}>
        <Pressable onPress={clearUpdate} hitSlop={8}>
          <Text style={styles.dismiss}>Later</Text>
        </Pressable>
        <Pressable style={styles.updateButton} onPress={handleUpdate}>
          <Text style={styles.updateText}>Update</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bg.surface,
    borderRadius: borderRadius.innerCard,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.shadow.raisedDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bg.debossed,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  version: {
    fontSize: 12,
    color: colors.text.muted,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dismiss: {
    fontSize: 13,
    color: colors.text.muted,
  },
  updateButton: {
    backgroundColor: colors.accent.primary,
    borderRadius: borderRadius.small,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  updateText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
  },
});
