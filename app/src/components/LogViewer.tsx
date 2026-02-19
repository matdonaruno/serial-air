import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ListRenderItemInfo,
} from 'react-native';
import { LogLine } from '../types';
import { useSettingsStore } from '../stores/useSettingsStore';
import { COLORS } from '../constants/defaults';
import { formatTimestamp } from '../utils/formatTimestamp';

interface LogViewerProps {
  lines: LogLine[];
  autoScroll: boolean;
}

export function LogViewer({ lines, autoScroll }: LogViewerProps) {
  const flatListRef = useRef<FlatList>(null);
  const colors = COLORS.dark;
  const fontSize = useSettingsStore((s) => s.fontSize);
  const showTimestamp = useSettingsStore((s) => s.showTimestamp);

  useEffect(() => {
    if (autoScroll && lines.length > 0) {
      // Small delay to ensure the list has rendered
      requestAnimationFrame(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      });
    }
  }, [lines.length, autoScroll]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<LogLine>) => (
      <View style={styles.logLine}>
        {showTimestamp && (
          <Text
            style={[
              styles.timestamp,
              { color: colors.timestamp, fontSize: fontSize - 2 },
            ]}
          >
            {formatTimestamp(item.timestamp)}
          </Text>
        )}
        <Text
          style={[styles.logText, { color: colors.logText, fontSize }]}
          selectable
        >
          {item.text}
        </Text>
      </View>
    ),
    [showTimestamp, fontSize, colors]
  );

  const keyExtractor = useCallback(
    (item: LogLine) => item.id.toString(),
    []
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.logBackground }]}>
      <FlatList
        ref={flatListRef}
        data={lines}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        initialNumToRender={50}
        maxToRenderPerBatch={30}
        windowSize={21}
        removeClippedSubviews={true}
        getItemLayout={(_data, index) => ({
          length: fontSize + 8,
          offset: (fontSize + 8) * index,
          index,
        })}
        contentContainerStyle={styles.content}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  logLine: {
    flexDirection: 'row',
    paddingVertical: 2,
  },
  timestamp: {
    fontFamily: 'Menlo',
    marginRight: 8,
    minWidth: 90,
  },
  logText: {
    fontFamily: 'Menlo',
    flex: 1,
  },
});
