import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { colors } from '../src/constants/theme';
import { useSettingsStore } from '../src/stores/useSettingsStore';
import { useDiscoveryStore } from '../src/stores/useDiscoveryStore';
import { useAppStore } from '../src/stores/useAppStore';
import { usePurchaseStore } from '../src/stores/usePurchaseStore';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const hasOnboarded = useAppStore((s) => s.hasOnboarded);

  useEffect(() => {
    async function prepare() {
      await useSettingsStore.getState().loadSettings();
      await useDiscoveryStore.getState().loadRecentConnections();
      await useAppStore.getState().loadState();
      await usePurchaseStore.getState().loadStatus();
      setReady(true);
      await SplashScreen.hideAsync();
    }
    prepare();
  }, []);

  if (!ready) return null;

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg.primary },
          animation: 'slide_from_right',
        }}
      >
        {!hasOnboarded && (
          <Stack.Screen
            name="onboarding"
            options={{ animation: 'fade' }}
          />
        )}
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="monitor"
          options={{
            animation: 'slide_from_right',
            gestureEnabled: true,
          }}
        />
        <Stack.Screen
          name="device-settings"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="firmware-update"
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="paywall"
          options={{
            animation: 'slide_from_bottom',
            presentation: 'modal',
            gestureEnabled: true,
          }}
        />
        <Stack.Screen
          name="code-generator"
          options={{ animation: 'slide_from_right' }}
        />
      </Stack>
    </>
  );
}
