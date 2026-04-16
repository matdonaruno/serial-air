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
import { ForceUpdateScreen } from '../src/components/ForceUpdateScreen';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  const hasOnboarded = useAppStore((s) => s.hasOnboarded);
  const forceUpdateRequired = useAppStore((s) => s.forceUpdateRequired);
  const remoteMessage = useAppStore((s) => s.remoteConfig?.message ?? null);

  useEffect(() => {
    async function prepare() {
      try {
        await useSettingsStore.getState().loadSettings();
        await useDiscoveryStore.getState().loadRecentConnections();
        await useAppStore.getState().loadState();
        await useAppStore.getState().loadRemoteConfig();
        await usePurchaseStore.getState().loadStatus();
        await useTrustStore.getState().loadTrustedDevices();
        await useMacroStore.getState().loadMacros();
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
      {forceUpdateRequired && <ForceUpdateScreen message={remoteMessage} />}
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
