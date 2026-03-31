import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Pressable, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../src/constants/theme';

type FeatherIconName = React.ComponentProps<typeof Feather>['name'];

const TAB_COUNT = 4;
const TAB_ICONS: FeatherIconName[] = ['home', 'terminal', 'bar-chart-2', 'settings'];

const SPRING_CONFIG = { damping: 18, stiffness: 180, mass: 0.8 };

function CustomTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get('window').width;
  const tabWidth = screenWidth / TAB_COUNT;

  const indicatorX = useSharedValue(state.index * tabWidth);

  useEffect(() => {
    indicatorX.value = withSpring(state.index * tabWidth, SPRING_CONFIG);
  }, [state.index]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  return (
    <View style={[styles.tabBarWrapper, { paddingBottom: insets.bottom }]}>
      <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />

      {/* Sliding indicator */}
      <Animated.View style={[styles.indicator, { width: tabWidth }, indicatorStyle]}>
        <View style={styles.indicatorDot} />
      </Animated.View>

      {/* Tab buttons */}
      <View style={styles.tabRow}>
        {state.routes.map((route: any, index: number) => {
          const focused = state.index === index;
          const iconName = TAB_ICONS[index];

          return (
            <TabButton
              key={route.key}
              icon={iconName}
              focused={focused}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

function TabButton({
  icon,
  focused,
  onPress,
}: {
  icon: FeatherIconName;
  focused: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(focused ? 1.1 : 1);
  const iconOpacity = useSharedValue(focused ? 1 : 0.45);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.1 : 1, SPRING_CONFIG);
    iconOpacity.value = withSpring(focused ? 1 : 0.45, SPRING_CONFIG);
  }, [focused]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: iconOpacity.value,
  }));

  return (
    <Pressable style={styles.tabButton} onPress={onPress}>
      <Animated.View style={[styles.tabIconContainer, animStyle]}>
        <Feather
          name={icon}
          size={26}
          color={focused ? colors.accent.primary : colors.text.secondary}
        />
      </Animated.View>
    </Pressable>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="terminal" options={{ title: 'Commands' }} />
      <Tabs.Screen name="analytics" options={{ title: 'Plotter' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(10, 10, 20, 0.6)',
    borderTopWidth: 0,
    overflow: 'hidden',
  },
  tabRow: {
    flexDirection: 'row',
    height: 70,
    alignItems: 'center',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 70,
  },
  tabIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicator: {
    position: 'absolute',
    top: 0,
    height: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorDot: {
    width: 24,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.accent.primary,
    shadowColor: colors.accent.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
});
