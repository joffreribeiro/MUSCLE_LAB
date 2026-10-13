import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '../../theme/tokens';

interface ExercisePlaceholderProps {
  width: number;
  height: number;
  /** Destaca o grupo muscular trabalhado (torso em vermelho) — usado na listagem do
   * Manual/Grupo e nas telas de execução/ficha. Placeholder até entrar mídia real. */
  highlighted?: boolean;
  limbColor?: string;
}

// Silhueta genérica (placeholder) — substituir por animação/ilustração real licenciada.
export function ExercisePlaceholder({
  width,
  height,
  highlighted = false,
  limbColor = colors.gray300,
}: ExercisePlaceholderProps) {
  const torsoColor = highlighted ? colors.red500 : limbColor;
  return (
    <Svg width={width} height={height} viewBox="0 0 20 28">
      <Circle cx={10} cy={4} r={3.4} fill={limbColor} />
      <Path
        d="M3 10.5C3 9 4.4 8 6 8h8c1.6 0 3 1 3 2.5V16c0 1.2-1 2-2.2 2H5.2C4 18 3 17.2 3 16z"
        fill={torsoColor}
      />
      <Rect x={5.5} y={19} width={3.4} height={8} rx={1.6} fill={limbColor} />
      <Rect x={11.1} y={19} width={3.4} height={8} rx={1.6} fill={limbColor} />
    </Svg>
  );
}
