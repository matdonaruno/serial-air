import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  StyleProp,
  TextInputProps,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, borderRadius, spacing } from '../../constants/theme';

type FeatherIconName = React.ComponentProps<typeof Feather>['name'];

interface NeuInputProps extends TextInputProps {
  icon?: FeatherIconName;
  label?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export function NeuInput({
  icon,
  label,
  containerStyle,
  style,
  ...props
}: NeuInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={containerStyle}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          focused && styles.inputContainerFocused,
        ]}
      >
        {icon && (
          <Feather
            name={icon}
            size={20}
            color={focused ? colors.accent.primary : colors.text.muted}
            style={styles.icon}
          />
        )}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.text.muted}
          selectionColor={colors.accent.primary}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.input,
    borderRadius: borderRadius.innerCard,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    // Debossed (inset) shadow approximation
    borderWidth: 1,
    borderColor: colors.shadow.innerDark,
    shadowColor: colors.shadow.innerDark,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  inputContainerFocused: {
    borderColor: 'rgba(255, 107, 53, 0.3)',
    shadowColor: colors.accent.primary,
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  icon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.primary,
    padding: 0,
  },
});
