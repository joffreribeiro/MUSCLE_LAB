import React, { useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';
import { colors } from '../theme/tokens';
import { formatShortDate } from '../utils/format';

const HEIGHT = 130;
const PAD_X = 24;
const PAD_TOP = 22;
const PAD_BOTTOM = 8;
const DEFAULT_W = 300;

export interface TrendPoint {
  dateISO: string;
  value: number;
}

/** Linha de evolução (peso, carga, 1RM…). Eixo x proporcional ao tempo; o último ponto fica em destaque. */
export function TrendChart({ series, format }: { series: TrendPoint[]; format: (value: number) => string }) {
  const [width, setWidth] = useState(DEFAULT_W);
  if (series.length < 2) return null;

  const times = series.map((e) => new Date(e.dateISO).getTime());
  const kgs = series.map((e) => e.value);
  const t0 = times[0];
  const span = Math.max(1, times[times.length - 1] - t0);
  const lo = Math.min(...kgs);
  const hi = Math.max(...kgs);
  const range = Math.max(1, hi - lo);

  const x = (t: number) => PAD_X + ((t - t0) / span) * (width - 2 * PAD_X);
  const y = (kg: number) => PAD_TOP + (1 - (kg - lo) / range) * (HEIGHT - PAD_TOP - PAD_BOTTOM);

  const points = series.map((e, i) => ({ x: x(times[i]), y: y(e.value), value: e.value }));
  const last = points[points.length - 1];

  return (
    <View onLayout={(e) => setWidth(Math.max(120, e.nativeEvent.layout.width))}>
      <Svg width={width} height={HEIGHT}>
        <Line x1={PAD_X} x2={width - PAD_X} y1={HEIGHT - PAD_BOTTOM} y2={HEIGHT - PAD_BOTTOM} stroke={colors.fill100} strokeWidth={1} />
        <Polyline
          points={points.map((p) => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke={colors.teal500}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {points.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={i === points.length - 1 ? 4.5 : 3} fill={i === points.length - 1 ? colors.navy700 : colors.teal500} />
        ))}
        <SvgText x={points[0].x} y={points[0].y - 8} fontSize={10} fill={colors.gray500} textAnchor="start">
          {format(points[0].value)}
        </SvgText>
        <SvgText x={last.x} y={last.y - 8} fontSize={10} fontWeight="700" fill={colors.navy700} textAnchor="end">
          {format(last.value)}
        </SvgText>
      </Svg>
      <View style={styles.axis}>
        <Text style={styles.axisLabel}>{formatShortDate(new Date(series[0].dateISO))}</Text>
        <Text style={styles.axisLabel}>{formatShortDate(new Date(series[series.length - 1].dateISO))}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  axis: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8, marginTop: 2 },
  axisLabel: { fontSize: 10, color: colors.gray500 },
});
