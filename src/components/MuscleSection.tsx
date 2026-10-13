import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BodyMapPair } from './BodyMap';
import { colors, radii } from '../theme/tokens';
import {
  Kinesiology,
  MuscleItem,
  itemDetail,
  itemName,
  regionRoles,
  regionsOf,
  roleBands,
  roleColor,
  roleGroups,
} from '../data/muscles';

const isUnpainted = (item: MuscleItem) => regionsOf(item).length === 0;

export function MuscleSection({ kinesiology }: { kinesiology: Kinesiology | null }) {
  if (!kinesiology) {
    return (
      <View style={styles.card}>
        <Text style={styles.emptyText}>Mapa muscular não disponível para este exercício.</Text>
      </View>
    );
  }

  const groups = roleGroups(kinesiology);
  const all = groups.flatMap((g) => g.items);

  return (
    <View style={styles.card}>
      <BodyMapPair roles={regionRoles(kinesiology)} />

      <View style={styles.legend}>
        {roleBands.map((band) => (
          <View key={band.role} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: band.color }]} />
            <Text style={styles.legendLabel}>{band.label}</Text>
          </View>
        ))}
      </View>

      {groups.map((group) => (
        <View key={group.role} style={styles.group}>
          <Text style={[styles.groupTitle, { color: roleColor(group.role) }]}>{group.label.toUpperCase()}</Text>
          {group.items.map((item) => {
            const detail = itemDetail(item);
            return (
              <View key={itemName(item)} style={styles.row}>
                <View
                  style={[
                    styles.rowDot,
                    isUnpainted(item)
                      ? { borderWidth: 1.5, borderColor: roleColor(group.role) }
                      : { backgroundColor: roleColor(group.role) },
                  ]}
                />
                <Text style={styles.rowText}>
                  {itemName(item)}
                  {detail ? <Text style={styles.rowDetail}> · {detail}</Text> : null}
                </Text>
              </View>
            );
          })}
        </View>
      ))}

      <View style={styles.footnotes}>
        {all.some(isUnpainted) ? (
          <Text style={styles.footnote}>○ Músculo profundo ou de apoio, sem região própria no mapa.</Text>
        ) : null}
        {kinesiology.fonte === 'estimado' ? (
          <Text style={styles.footnote}>Estimativa: este exercício não consta nos mapas de cinesiologia.</Text>
        ) : null}
        {kinesiology.fonte === 'adaptado' ? (
          <Text style={styles.footnote}>Adaptado de um exercício equivalente dos mapas de cinesiologia.</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radii.card, padding: 14 },
  emptyText: { fontSize: 14, color: colors.gray500 },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 11, color: colors.gray500 },
  group: { marginTop: 16 },
  groupTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.9, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 4 },
  rowDot: { width: 8, height: 8, borderRadius: 4 },
  rowText: { flex: 1, fontSize: 14, lineHeight: 19, color: colors.ink },
  rowDetail: { color: colors.gray500 },
  footnotes: { marginTop: 10, gap: 3 },
  footnote: { fontSize: 11, lineHeight: 15, color: colors.gray500 },
});
