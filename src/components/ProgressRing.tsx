import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { colors } from '../theme/tokens';

interface ProgressRingProps {
  size: number;
  radius: number;
  strokeWidth: number;
  pct: number; // 0..1
  color: string;
  trackColor?: string;
  label?: string;
  labelFontSize?: number;
  labelColor?: string;
}

export function ProgressRing({
  size,
  radius,
  strokeWidth,
  pct,
  color,
  trackColor = colors.fill100,
  label,
  labelFontSize = 10,
  labelColor,
}: ProgressRingProps) {
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  // Evita os limites exatos 0/1: nesses pontos o offset cai exatamente sobre o próprio
  // dasharray e alguns motores SVG desenham o arco cheio em vez de vazio (fronteira de
  // arredondamento). 0.1% de diferença é imperceptível e resolve o problema.
  const safePct = Math.max(0.001, Math.min(0.999, pct));
  const offset = circumference * (1 - safePct);
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle cx={center} cy={center} r={radius} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          // transform em string em vez de rotation/origin: no web, origin vira o atributo
          // inválido transform-origin e gera erro no console.
          transform={`rotate(-90 ${center} ${center})`}
        />
        {label ? (
          <SvgText
            x={center}
            y={center + labelFontSize * 0.35}
            textAnchor="middle"
            fontSize={labelFontSize}
            fontWeight="700"
            fill={labelColor ?? color}
          >
            {label}
          </SvgText>
        ) : null}
      </Svg>
    </View>
  );
}
