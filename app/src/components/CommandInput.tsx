import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/defaults';

interface CommandInputProps {
  onSend: (command: string) => void;
  disabled?: boolean;
}

export function CommandInput({ onSend, disabled }: CommandInputProps) {
  const [text, setText] = useState('');
  const colors = COLORS.dark;

  const handleSend = () => {
    const trimmed = text.trim();
    if (trimmed.length === 0) return;
    onSend(trimmed);
    setText('');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <TextInput
        style={[styles.input, { color: colors.text, backgroundColor: colors.logBackground, borderColor: colors.border }]}
        placeholder="Send command..."
        placeholderTextColor={colors.textMuted}
        value={text}
        onChangeText={setText}
        onSubmitEditing={handleSend}
        editable={!disabled}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="send"
      />
      <TouchableOpacity
        style={[
          styles.sendButton,
          { backgroundColor: text.trim() && !disabled ? colors.primary : colors.border },
        ]}
        onPress={handleSend}
        disabled={!text.trim() || disabled}
      >
        <Ionicons name="send" size={18} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    fontFamily: 'Menlo',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});
