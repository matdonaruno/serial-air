import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { LogLine } from '../types';
import { formatTimestamp } from './formatTimestamp';

export async function exportLogToText(lines: LogLine[]): Promise<string> {
  const content = lines
    .map((line) => `${formatTimestamp(line.timestamp)}  ${line.text}`)
    .join('\n');

  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, '-')
    .slice(0, 19);
  const filename = `serial-air-log-${timestamp}.txt`;
  const fileUri = `${FileSystem.documentDirectory}${filename}`;

  await FileSystem.writeAsStringAsync(fileUri, content, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/plain',
      dialogTitle: 'Export Serial Log',
    });
  }

  return fileUri;
}
