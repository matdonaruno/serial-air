import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { colors } from '../src/constants/theme';
import { useSettingsStore } from '../src/stores/useSettingsStore';
import { useDiscoveryStore } from '../src/stores/useDiscoveryStore';
import { useAppStore } from '../src/stores/useAppStore';
import { usePurchaseStore } from '../src/stores/usePurchaseStore';
import { useTrustStore } from '../src/stores/useTrustStore';
import { useMacroStore } from '../src/stores/useMacroStore';
import { AnimatedSplash } from '../src/components/AnimatedSplash';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  const hasOnboarded = useAppStore((s) => s.hasOnboarded);

  useEffect(() => {
    async function prepare() {
      try {
        console.log('[App] Loading settings...');
        await useSettingsStore.getState().loadSettings();
        console.log('[App] Loading recent connections...');
        await useDiscoveryStore.getState().loadRecentConnections();
        console.log('[App] Loading app state...');
        await useAppStore.getState().loadState();
        console.log('[App] Loading purchase status...');
        await usePurchaseStore.getState().loadStatus();
        console.log('[App] Loading trusted devices...');
        await useTrustStore.getState().loadTrustedDevices();
        console.log('[App] Loading macros...');
        await useMacroStore.getState().loadMacros();
        console.log('[App] All loaded, showing app');
        setReady(true);
        await SplashScreen.hideAsync();
      } catch (e) {
        console.error('[App] Init error:', e);
        setReady(true);
        await SplashScreen.hideAsync();
      }
    }
    prepare();
  }, []);

  if (!ready) return null;

  return (
    <>
      <StatusBar style="light" />
      {!splashDone && <AnimatedSplash onFinish={() => setSplashDone(true)} />}
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
        <Stack.Screen
          name="trusted-devices"
          options={{ animation: 'slide_from_right' }}
        />
      </Stack>
    </>
  );
}
