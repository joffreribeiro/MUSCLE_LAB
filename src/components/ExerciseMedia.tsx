import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { ExercisePlaceholder } from './icons/ExercisePlaceholder';
import { getExerciseMedia } from '../data/media';
import { colors } from '../theme/tokens';

interface ExerciseMediaProps {
  exerciseId: string;
  /** Dimensões do placeholder SVG (silhueta) quando não há mídia real. */
  placeholderWidth: number;
  placeholderHeight: number;
  /** Legenda mostrada só no modo placeholder. Omitir/deixar vazio esconde a legenda (útil em thumbs pequenos). */
  placeholderCaption?: string;
  placeholderHighlighted?: boolean;
  placeholderLimbColor?: string;
}

// Mostra a animação real do exercício (GIF) quando disponível; caso contrário,
// cai para a silhueta placeholder.
export function ExerciseMedia({
  exerciseId,
  placeholderWidth,
  placeholderHeight,
  placeholderCaption,
  placeholderHighlighted = false,
  placeholderLimbColor = colors.gray300,
}: ExerciseMediaProps) {
  const source = getExerciseMedia(exerciseId);

  if (source) {
    return (
      <Image
        source={source}
        style={styles.image}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
    );
  }

  return (
    <View style={styles.placeholderCenter}>
      <ExercisePlaceholder
        width={placeholderWidth}
        height={placeholderHeight}
        highlighted={placeholderHighlighted}
        limbColor={placeholderLimbColor}
      />
      {placeholderCaption ? <Text style={styles.placeholderCaption}>{placeholderCaption}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  image: { width: '100%', height: '100%' },
  placeholderCenter: { alignItems: 'center' },
  placeholderCaption: {
    fontSize: 9,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: colors.gray400,
    marginTop: 8,
  },
});
