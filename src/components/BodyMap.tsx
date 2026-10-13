import React from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';
import { colors } from '../theme/tokens';
import { roleColor } from '../data/muscles';
import { BACK_SHAPES, FRONT_SHAPES, pathsOf } from '../data/bodyShapes';
import { BodyView, MuscleKey, RegionRoles } from '../types';

// Ilustração anatômica base. As duas foram recortadas da mesma arte com a mesma
// escala e linha de base, então os paths abaixo valem para as duas vistas.
const ART = {
  frente: require('../../assets/body/frente.png'),
  costas: require('../../assets/body/costas.png'),
};

const VB_W = 450;
const VB_H = 1151;
const ASPECT = VB_H / VB_W;

// Contornos em data/bodyShapes.ts (espaço 450x1151, centro em x=225). Só o lado
// esquerdo é declarado — o direito sai por espelhamento. Os paths são calculados uma vez.
const PATHS: Record<BodyView, Partial<Record<MuscleKey, string>>> = {
  frente: pathsOf(FRONT_SHAPES),
  costas: pathsOf(BACK_SHAPES),
};

const MIRROR = `translate(${VB_W}, 0) scale(-1, 1)`;
const HIGHLIGHT_OPACITY = 0.5;

/** Músculos com região desenhada em cada vista. */
export const REGIONS_BY_VIEW: Record<BodyView, MuscleKey[]> = {
  frente: Object.keys(PATHS.frente) as MuscleKey[],
  costas: Object.keys(PATHS.costas) as MuscleKey[],
};

export interface RegionFill {
  color: string;
  opacity: number;
}

interface BodyFigureProps {
  view: BodyView;
  width: number;
  fills: Partial<Record<MuscleKey, RegionFill>>;
  /** Quando presente, as regiões pintadas viram áreas de toque. */
  onPressRegion?: (key: MuscleKey) => void;
}

// No web, onPress do react-native-svg injeta handlers de responder no <path> e o React
// avisa no console; onClick vai direto para o DOM. onPress precisa ser null (não
// undefined): senão o prepare() do react-native-svg sobrescreve onClick com ele.
// No celular, onPress é o caminho certo.
const pressProps = (handler?: () => void): object =>
  !handler ? {} : Platform.OS === 'web' ? { onClick: handler, onPress: null } : { onPress: handler };

/** Ilustração + regiões pintadas por cima. Base do mapa (Ficha) e do seletor de músculo. */
export function BodyFigure({ view, width, fills, onPressRegion }: BodyFigureProps) {
  const map = PATHS[view];
  const height = width * ASPECT;
  const painted = (Object.keys(map) as MuscleKey[]).filter((key) => fills[key]);

  return (
    <View style={{ width, height }}>
      <Image source={ART[view]} style={{ width, height }} resizeMode="contain" />
      <Svg
        width={width}
        height={height}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        style={StyleSheet.absoluteFill}
        pointerEvents={onPressRegion ? 'auto' : 'none'}
      >
        {['', MIRROR].map((tf, i) => (
          <G key={i} transform={tf || undefined}>
            {painted.map((key) => (
              <Path
                key={key}
                d={map[key]!}
                fill={fills[key]!.color}
                fillOpacity={fills[key]!.opacity}
                {...pressProps(onPressRegion ? () => onPressRegion(key) : undefined)}
              />
            ))}
          </G>
        ))}
      </Svg>
    </View>
  );
}

interface BodyMapProps {
  roles: RegionRoles;
  view: BodyView;
  width?: number;
}

/** Mapa da Ficha: cada região pintada com a cor do papel do músculo no exercício. */
export function BodyMap({ roles, view, width = 130 }: BodyMapProps) {
  const fills: Partial<Record<MuscleKey, RegionFill>> = {};
  for (const key of Object.keys(roles) as MuscleKey[]) {
    fills[key] = { color: roleColor(roles[key]!), opacity: HIGHLIGHT_OPACITY };
  }
  return <BodyFigure view={view} width={width} fills={fills} />;
}

/** Frente + costas lado a lado, com rótulo embaixo de cada uma. */
export function BodyMapPair({ roles, width = 130 }: { roles: RegionRoles; width?: number }) {
  return (
    <View style={styles.pair}>
      {(['frente', 'costas'] as BodyView[]).map((view) => (
        <View key={view} style={styles.column}>
          <BodyMap roles={roles} view={view} width={width} />
          <Text style={styles.viewLabel}>{view === 'frente' ? 'FRENTE' : 'COSTAS'}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  pair: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  column: { alignItems: 'center' },
  viewLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.gray500,
    marginTop: 6,
  },
});
