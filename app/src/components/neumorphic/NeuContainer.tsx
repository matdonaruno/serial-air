import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors, borderRadius } from '../../constants/theme';

interface NeuContainerProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Debossed (inset shadow) container — used for log viewer, terminal area.
 */
export function NeuContainer({ children, style }: NeuContainerProps) {
  return <View style={[styles.container, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg.debossed,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: colors.border,
    // Approximate inset shadow
    shadowColor: colors.shadow.innerDark,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    overflow: 'hidden',
  },
});
