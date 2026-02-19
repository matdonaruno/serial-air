import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { COLORS, DEFAULT_PORT } from '../constants/defaults';

interface ManualConnectProps {
  onConnect: (host: string, port: number) => void;
}

export function ManualConnect({ onConnect }: ManualConnectProps) {
  const [host, setHost] = useState('');
  const [port, setPort] = useState(String(DEFAULT_PORT));
  const colors = COLORS.dark;

  const handleConnect = () => {
    const trimmedHost = host.trim();
    if (!trimmedHost) return;
    const portNum = parseInt(port, 10) || DEFAULT_PORT;
    onConnect(trimmedHost, portNum);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.textSecondary }]}>
        Manual Connection
      </Text>
      <View style={styles.inputRow}>
        <TextInput
          style={[
            styles.hostInput,
            { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          placeholder="IP Address"
          placeholderTextColor={colors.textMuted}
          value={host}
          onChangeText={setHost}
          keyboardType="decimal-pad"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextInput
          style={[
            styles.portInput,
            { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          placeholder="Port"
          placeholderTextColor={colors.textMuted}
          value={port}
          onChangeText={setPort}
          keyboardType="number-pad"
        />
      </View>
      <TouchableOpacity
        style={[
          styles.connectButton,
          { backgroundColor: host.trim() ? colors.primary : colors.border },
        ]}
        onPress={handleConnect}
        disabled={!host.trim()}
      >
        <Text style={styles.connectButtonText}>Connect</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 16,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  hostInput: {
    flex: 2,
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  portInput: {
    flex: 1,
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  connectButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
