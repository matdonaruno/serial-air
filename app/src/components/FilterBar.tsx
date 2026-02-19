import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/defaults';

interface FilterBarProps {
  value: string;
  onChangeText: (text: string) => void;
}

export function FilterBar({ value, onChangeText }: FilterBarProps) {
  const colors = COLORS.dark;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Ionicons
        name="search"
        size={18}
        color={colors.textMuted}
        style={styles.icon}
      />
      <TextInput
        style={[styles.input, { color: colors.text }]}
        placeholder="Filter logs..."
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
      {value.length > 0 && (
        <Ionicons
          name="close-circle"
          size={18}
          color={colors.textMuted}
          onPress={() => onChangeText('')}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 4,
    fontFamily: 'Menlo',
  },
});
