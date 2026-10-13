import React from 'react';
import { Platform } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

// Conjunto de ícones da interface (outline, mesmo traço da tab bar). Substitui emojis e
// símbolos de texto, que mudam de aparência em cada celular.
export type IconName =
  | 'clock'
  | 'menu'
  | 'person'
  | 'rotate'
  | 'clipboard'
  | 'close'
  | 'star'
  | 'warning'
  | 'play'
  | 'check'
  | 'pencil'
  | 'swap'
  | 'link';

// Ícone decorativo: some para leitores de tela. Essas props só existem no celular; na web o React reclama delas.
const hiddenFromReaders = Platform.OS === 'web' ? {} : { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' as const };

interface IconProps {
  name: IconName;
  color: string;
  size?: number;
  strokeWidth?: number;
}

export function Icon({ name, color, size = 20, strokeWidth = 1.8 }: IconProps) {
  const line = { fill: 'none', stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...hiddenFromReaders}>
      {name === 'clock' ? (
        <>
          <Circle cx={12} cy={12} r={8.5} {...line} />
          <Path d="M12 7.5V12l3 2" {...line} />
        </>
      ) : null}
      {name === 'menu' ? <Path d="M4 7h16M4 12h16M4 17h16" {...line} /> : null}
      {name === 'person' ? (
        <>
          <Circle cx={12} cy={5.5} r={2.3} {...line} />
          <Path d="M6 10.5h12M12 8.5v6M12 14.5l-3 6M12 14.5l3 6" {...line} />
        </>
      ) : null}
      {name === 'rotate' ? <Path d="M20.5 12a8.5 8.5 0 11-2.6-6.1M20.5 4v5h-5" {...line} /> : null}
      {name === 'clipboard' ? (
        <>
          <Rect x={6} y={5} width={12} height={16} rx={2} {...line} />
          <Path d="M9 5V4h6v1M9 11h6M9 15h6" {...line} />
        </>
      ) : null}
      {name === 'link' ? (
        <>
          <Path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1" {...line} />
          <Path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" {...line} />
        </>
      ) : null}
      {name === 'close' ? <Path d="M6 6l12 12M18 6L6 18" {...line} /> : null}
      {name === 'star' ? (
        <Path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.9z" {...line} />
      ) : null}
      {name === 'warning' ? (
        <>
          <Path d="M12 4l9 16H3z" {...line} />
          <Path d="M12 10v4" {...line} />
          <Circle cx={12} cy={17.2} r={0.6} fill={color} stroke={color} strokeWidth={0.6} />
        </>
      ) : null}
      {name === 'play' ? <Path d="M8 5.5v13l10.5-6.5z" fill={color} stroke={color} strokeWidth={1.2} strokeLinejoin="round" /> : null}
      {name === 'check' ? <Path d="M5 12.5l4.5 4.5L19 7.5" {...line} /> : null}
      {name === 'pencil' ? <Path d="M4 20l1-4L16 5l3 3L8 19zM14 7l3 3" {...line} /> : null}
      {name === 'swap' ? <Path d="M20 11a8 8 0 00-14-4M4 5v4h4M4 13a8 8 0 0014 4M20 19v-4h-4" {...line} /> : null}
    </Svg>
  );
}
