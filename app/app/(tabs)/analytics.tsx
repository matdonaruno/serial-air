import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  colors,
  typography,
  spacing,
  layout,
} from '../../src/constants/theme';

export default function AnalyticsScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ANALYTICS</Text>
      </View>

      {/* Centered placeholder content */}
      <View style={styles.content}>
        <Feather
          name="bar-chart-2"
          size={48}
          color={colors.text.muted}
        />
        <Text style={styles.comingSoon}>Coming in v1.1</Text>
        <Text style={styles.description}>
          Real-time data visualization and device statistics
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  header: {
    height: layout.headerHeight,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: layout.screenPaddingH,
  },
  headerTitle: {
    ...typography.headerTitle,
    color: colors.text.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  comingSoon: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  description: {
    ...typography.bodySmall,
    color: colors.text.muted,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 20,
  },
});
