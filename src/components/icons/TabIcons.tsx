import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

interface IconProps {
  color: string;
  size?: number;
}

const common = { fill: 'none', strokeWidth: 1.8, strokeLinecap: 'round' as const };

export function TreinosIcon({ color, size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...common} stroke={color}>
      <Path d="M4 9v6M20 9v6M7 6v12M17 6v12M7 12h10" />
    </Svg>
  );
}

export function ManualIcon({ color, size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...common} stroke={color}>
      <Path d="M5 5.5A1.5 1.5 0 016.5 4H19v16H6.5A1.5 1.5 0 015 18.5z" />
      <Path d="M9 4v16" />
    </Svg>
  );
}

export function MaisIcon({ color, size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...common} stroke={color}>
      <Circle cx={6} cy={12} r={1.4} />
      <Circle cx={12} cy={12} r={1.4} />
      <Circle cx={18} cy={12} r={1.4} />
    </Svg>
  );
}
