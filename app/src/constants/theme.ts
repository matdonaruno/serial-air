/**
 * Serial Air — Dark Neumorphism Design System
 *
 * Based on DESIGN.md specification.
 * All design tokens defined here; components import from this file.
 */

// ============================================================
// Colors
// ============================================================

export const colors = {
  // Background
  bg: {
    primary: '#1A1A2E',
    surface: '#1E1E32',
    surfaceLight: '#252540',
    surfaceRaised: '#2A2A45',
    debossed: '#16162A',
    input: '#0D0D17',
  },

  // Neumorphism Shadows (as color values)
  shadow: {
    dark: '#12121F',
    light: '#252545',
    innerDark: '#101020',
    innerLight: '#2F2F50',
    raisedDark: '#0B0B13',
    raisedLight: '#1D1D2F',
  },

  // Text
  text: {
    primary: '#E8E8F0',
    secondary: '#8888A0',
    muted: '#555570',
    timestamp: '#6A6A85',
    dim: '#D1D1E0',
  },

  // Accent (Orange)
  accent: {
    primary: '#FF6B35',
    active: '#FF8855',
    glow: 'rgba(255, 107, 53, 0.25)',
    glowStrong: 'rgba(255, 107, 53, 0.5)',
  },

  // Status
  status: {
    connected: '#4ADE80',
    connectedGlow: 'rgba(74, 222, 128, 0.7)',
    connecting: '#FBBF24',
    disconnected: '#F87171',
    offline: '#555570',
  },

  // Log Levels
  log: {
    default: '#E8E8F0',
    error: '#F87171',
    warning: '#FBBF24',
    info: '#60A5FA',
    debug: '#8888A0',
    ota: '#A78BFA',
    success: '#4ADE80',
  },

  // Utility
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.5)',
  border: 'rgba(255, 255, 255, 0.02)',
  borderLight: 'rgba(255, 255, 255, 0.03)',
  danger: '#F87171',
} as const;

// ============================================================
// Spacing
// ============================================================

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// ============================================================
// Border Radius
// ============================================================

export const borderRadius = {
  full: 9999,
  card: 24,
  cardLarge: 32,
  innerCard: 16,
  input: 12,
  button: 20,
  small: 8,
  tab: 16,
} as const;

// ============================================================
// Typography
// ============================================================

export const typography = {
  titleLarge: {
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: 1.5,
  },
  titleMedium: {
    fontSize: 22,
    fontWeight: '700' as const,
    letterSpacing: 1.5,
  },
  titleSmall: {
    fontSize: 18,
    fontWeight: '600' as const,
    letterSpacing: 0,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 3,
    textTransform: 'uppercase' as const,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  logText: {
    fontSize: 13,
    fontFamily: 'Menlo',
  },
  logTimestamp: {
    fontSize: 11,
    fontFamily: 'Menlo',
  },
  deviceName: {
    fontSize: 17,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    letterSpacing: 2.5,
    textTransform: 'uppercase' as const,
  },
  buttonLabel: {
    fontSize: 10,
    fontWeight: '500' as const,
  },
} as const;

// ============================================================
// Neumorphic Shadow Presets
// ============================================================

export const neuShadow = {
  raised: {
    shadowColor: colors.shadow.raisedDark,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 8,
  },
  flat: {
    shadowColor: colors.shadow.raisedDark,
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 5,
  },
  button: {
    shadowColor: colors.shadow.raisedDark,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
    elevation: 4,
  },
  icon: {
    shadowColor: colors.shadow.raisedDark,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 3,
  },
} as const;

// ============================================================
// Animation Config
// ============================================================

export const animation = {
  statusPulse: {
    duration: 2000,
  },
  statusBlink: {
    duration: 600,
  },
  buttonPress: {
    scale: 0.95,
    duration: 100,
  },
  cardTap: {
    scale: 0.98,
    duration: 150,
  },
  logFadeIn: {
    duration: 150,
  },
  deviceSlideIn: {
    duration: 300,
  },
} as const;

// ============================================================
// Layout
// ============================================================

export const layout = {
  screenPaddingH: spacing.lg,
  screenPaddingV: spacing.md,
  tabBarHeight: 80,
  headerHeight: 56,
  actionButtonSize: 40,
  actionButtonLarge: 64,
  connectButtonSize: 64,
  deviceIconSize: 56,
} as const;
