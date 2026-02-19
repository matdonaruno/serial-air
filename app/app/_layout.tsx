import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSettingsStore } from '../src/stores/useSettingsStore';
import { useDiscoveryStore } from '../src/stores/useDiscoveryStore';
import { COLORS } from '../src/constants/defaults';

export default function RootLayout() {
  const colors = COLORS.dark;

  useEffect(() => {
    useSettingsStore.getState().loadSettings();
    useDiscoveryStore.getState().loadRecentConnections();
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'Serial Air',
            headerLargeTitle: true,
          }}
        />
        <Stack.Screen
          name="monitor"
          options={{
            title: 'Monitor',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            title: 'Settings',
            headerBackTitle: 'Back',
          }}
        />
      </Stack>
    </>
  );
}
