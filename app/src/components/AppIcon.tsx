import React from 'react';
import Svg, { Defs, RadialGradient, Stop, Rect, Circle, G, Path } from 'react-native-svg';

interface AppIconProps {
  size?: number;
}

/**
 * SVG App icon: Dark neumorphic background with WiFi waves in accent orange.
 * Can be used in-app and exported as PNG for App Store.
 */
export function AppIcon({ size = 200 }: AppIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 1024 1024">
      <Defs>
        <RadialGradient id="bg" cx="50%" cy="40%" r="60%">
          <Stop offset="0%" stopColor="#22223A" />
          <Stop offset="100%" stopColor="#1A1A2E" />
        </RadialGradient>
        <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#FF6B35" stopOpacity="0.3" />
          <Stop offset="100%" stopColor="#FF6B35" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      {/* Background */}
      <Rect width="1024" height="1024" rx="224" fill="url(#bg)" />
      {/* Subtle inner highlight (neumorphic) */}
      <Rect
        x="8" y="8" width="1008" height="1008" rx="220"
        fill="none" stroke="#2A2A45" strokeWidth="2" opacity="0.5"
      />
      {/* Glow behind icon */}
      <Circle cx="512" cy="480" r="200" fill="url(#glow)" />
      {/* WiFi waves */}
      <G transform="translate(512, 520)" fill="none" stroke="#FF6B35" strokeWidth="40" strokeLinecap="round">
        {/* Outer arc */}
        <Path d="M-180,-130 A 220,220 0 0,1 180,-130" opacity="0.5" />
        {/* Middle arc */}
        <Path d="M-120,-100 A 150,150 0 0,1 120,-100" opacity="0.75" />
        {/* Inner arc */}
        <Path d="M-60,-70 A 80,80 0 0,1 60,-70" />
      </G>
      {/* Center dot */}
      <Circle cx="512" cy="540" r="30" fill="#FF6B35" />
      {/* Text "SA" subtle branding */}
      {/* Omitted for clean icon — WiFi symbol is sufficient */}
    </Svg>
  );
}
