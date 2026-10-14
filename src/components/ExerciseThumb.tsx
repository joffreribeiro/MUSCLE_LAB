import React from 'react';
import { View } from 'react-native';
import { ExerciseMedia } from './ExerciseMedia';

/**
 * Miniatura do exercício nas listas: a figura inteira, grande e sem moldura nem fundo,
 * para dar para ver o movimento e o músculo trabalhado de relance. O branco das animações se funde com o fundo
 * da linha (multiply), então a miniatura não aparece como uma caixa branca sobre linhas coloridas.
 */
export function ExerciseThumb({ exerciseId, size = 76, highlighted = false }: { exerciseId: string; size?: number; highlighted?: boolean }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', mixBlendMode: 'multiply' }}>
      <ExerciseMedia
        exerciseId={exerciseId}
        fit="contain"
        placeholderWidth={Math.round(size * 0.42)}
        placeholderHeight={Math.round(size * 0.58)}
        placeholderHighlighted={highlighted}
      />
    </View>
  );
}
