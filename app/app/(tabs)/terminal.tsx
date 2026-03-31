import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { NeuCard, NeuButton, NeuInput } from '../../src/components/neumorphic';
import { useConnectionStore } from '../../src/stores/useConnectionStore';
import { useMacroStore, Macro } from '../../src/stores/useMacroStore';
import { t } from '../../src/i18n';
import { CoachMark } from '../../src/components/CoachMark';
import {
  colors,
  spacing,
  typography,
  layout,
  borderRadius,
  neuShadow,
} from '../../src/constants/theme';

export default function TerminalScreen() {
  const status = useConnectionStore((s) => s.status);
  const sendCommand = useConnectionStore((s) => s.sendCommand);
  const currentDevice = useConnectionStore((s) => s.currentDevice);
  const macros = useMacroStore((s) => s.macros);
  const loadMacros = useMacroStore((s) => s.loadMacros);
  const addMacro = useMacroStore((s) => s.addMacro);
  const removeMacro = useMacroStore((s) => s.removeMacro);

  const [newName, setNewName] = useState('');
  const [newCommand, setNewCommand] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [lastSent, setLastSent] = useState<string | null>(null);

  const isConnected = status === 'connected';

  useEffect(() => {
    loadMacros();
  }, []);

  // Clear "sent" feedback after 2s
  useEffect(() => {
    if (!lastSent) return;
    const timer = setTimeout(() => setLastSent(null), 2000);
    return () => clearTimeout(timer);
  }, [lastSent]);

  const handleSend = useCallback(
    (macro: Macro) => {
      if (!isConnected) {
        Alert.alert(t('macros_not_connected'));
        return;
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      sendCommand(macro.command);
      setLastSent(macro.id);
    },
    [isConnected, sendCommand],
  );

  const handleDelete = useCallback(
    (macro: Macro) => {
      Alert.alert(
        t('macros_delete_title'),
        t('macros_delete_msg')(macro.name),
        [
          { text: t('cancel'), style: 'cancel' },
          {
            text: t('macros_delete_button'),
            style: 'destructive',
            onPress: () => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              removeMacro(macro.id);
            },
          },
        ],
      );
    },
    [removeMacro],
  );

  const handleAdd = useCallback(() => {
    const name = newName.trim();
    const command = newCommand.trim();
    if (!name || !command) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addMacro(name, command);
    setNewName('');
    setNewCommand('');
    setShowAdd(false);
  }, [newName, newCommand, addMacro]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('macros_title')}</Text>
        <NeuButton
          icon={showAdd ? 'x' : 'plus'}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowAdd(!showAdd);
          }}
          size={layout.actionButtonSize}
        />
      </View>

      {/* Connection status */}
      <View style={[styles.statusBar, isConnected && styles.statusBarConnected]}>
        <View style={[styles.statusDot, { backgroundColor: isConnected ? colors.status.connected : colors.text.muted }]} />
        <Text style={[styles.statusText, { color: isConnected ? colors.status.connected : colors.text.muted }]}>
          {isConnected ? currentDevice?.name ?? 'Device' : t('macros_not_connected')}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Add form */}
        {showAdd && (
          <NeuCard style={styles.addCard}>
            <NeuInput
              icon="tag"
              placeholder={t('macros_name_placeholder')}
              value={newName}
              onChangeText={setNewName}
              autoCapitalize="none"
              containerStyle={styles.addInput}
            />
            <NeuInput
              icon="terminal"
              placeholder={t('macros_command_placeholder')}
              value={newCommand}
              onChangeText={setNewCommand}
              autoCapitalize="none"
              autoCorrect={false}
              containerStyle={styles.addInput}
              style={{ fontFamily: 'Menlo', fontSize: 14 }}
            />
            <Pressable
              style={[styles.addButton, (!newName.trim() || !newCommand.trim()) && styles.addButtonDisabled]}
              onPress={handleAdd}
              disabled={!newName.trim() || !newCommand.trim()}
            >
              <Feather name="plus" size={16} color={colors.bg.primary} />
              <Text style={styles.addButtonText}>{t('macros_add')}</Text>
            </Pressable>
          </NeuCard>
        )}

        {/* Macro list */}
        {macros.length === 0 && !showAdd ? (
          <NeuCard style={styles.emptyCard}>
            <View style={styles.emptyContent}>
              <Feather name="zap" size={32} color={colors.text.muted} />
              <Text style={styles.emptyTitle}>{t('macros_empty')}</Text>
              <Text style={styles.emptySubtext}>{t('macros_empty_sub')}</Text>
            </View>
          </NeuCard>
        ) : (
          macros.map((macro) => (
            <NeuCard key={macro.id} style={styles.macroCard}>
              <View style={styles.macroRow}>
                <Pressable
                  style={styles.macroInfo}
                  onLongPress={() => handleDelete(macro)}
                >
                  <Text style={styles.macroName}>{macro.name}</Text>
                  <Text style={styles.macroCommand}>{macro.command}</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.sendButton,
                    !isConnected && styles.sendButtonDisabled,
                    lastSent === macro.id && styles.sendButtonSent,
                  ]}
                  onPress={() => handleSend(macro)}
                  disabled={!isConnected}
                >
                  <Feather
                    name={lastSent === macro.id ? 'check' : 'send'}
                    size={16}
                    color={lastSent === macro.id ? colors.status.connected : isConnected ? colors.bg.primary : colors.text.muted}
                  />
                </Pressable>
              </View>
            </NeuCard>
          ))
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <CoachMark
        id="macros"
        steps={[
          { icon: 'zap', title: t('coach_macros_1_title'), description: t('coach_macros_1_desc') },
          { icon: 'trash-2', title: t('coach_macros_2_title'), description: t('coach_macros_2_desc') },
        ]}
        dismissLabel={t('coach_ok')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: layout.screenPaddingH,
    height: layout.headerHeight,
    position: 'relative',
  },
  headerTitle: {
    ...typography.headerTitle,
    color: colors.text.primary,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: layout.screenPaddingH,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: borderRadius.innerCard,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
    marginBottom: spacing.md,
  },
  statusBarConnected: {
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPaddingH,
  },
  addCard: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  addInput: {},
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent.primary,
    borderRadius: borderRadius.innerCard,
    paddingVertical: 12,
  },
  addButtonDisabled: {
    opacity: 0.4,
  },
  addButtonText: {
    ...typography.bodySmall,
    color: colors.bg.primary,
    fontWeight: '700',
  },
  emptyCard: {
    marginTop: spacing.xl,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyTitle: {
    ...typography.body,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  emptySubtext: {
    ...typography.caption,
    color: colors.text.muted,
    textAlign: 'center',
  },
  macroCard: {
    marginBottom: spacing.sm,
  },
  macroRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  macroInfo: {
    flex: 1,
  },
  macroName: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  macroCommand: {
    fontFamily: 'Menlo',
    fontSize: 13,
    color: colors.accent.primary,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
  },
  sendButtonDisabled: {
    backgroundColor: colors.bg.surfaceLight,
  },
  sendButtonSent: {
    backgroundColor: colors.status.connected,
  },
  bottomSpacer: {
    height: 140,
  },
});
