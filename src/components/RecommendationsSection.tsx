import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, minTouchTarget, radii } from '../theme/tokens';
import { Recommendation, RecommendationAction, RecommendationId } from '../data/recommendations';

interface Props {
  items: Recommendation[];
  onAction: (kind: RecommendationAction, id: RecommendationId) => void;
  onDismiss: (id: RecommendationId) => void;
}

const AMBER_TEXT = '#9A7413';

/** "Recomendações": avisos e sugestões do app, do mais importante ao menos. Some quando não há nada a dizer. */
export function RecommendationsSection({ items, onAction, onDismiss }: Props) {
  // Ações que mudam seus treinos pedem um segundo toque.
  const [confirming, setConfirming] = useState<RecommendationId | null>(null);
  if (items.length === 0) return null;

  return (
    <View>
      <Text style={styles.header}>Recomendações</Text>
      {items.map((r) => {
        const alert = r.tone === 'alerta';
        const confirm = confirming === r.id;
        const needsConfirm = r.action?.kind === 'deload';
        return (
          <View key={r.id} style={[styles.card, alert ? styles.cardAlert : styles.cardInfo]}>
            <Text style={[styles.title, alert && styles.titleAlert]}>{r.title}</Text>
            <Text style={styles.text}>{r.text}</Text>
            <View style={styles.actions}>
              {r.action ? (
                <Pressable
                  style={[styles.button, alert ? styles.buttonAlert : styles.buttonInfo, confirm && styles.buttonConfirm]}
                  onPress={() => {
                    if (needsConfirm && !confirm) {
                      setConfirming(r.id);
                      return;
                    }
                    setConfirming(null);
                    onAction(r.action!.kind, r.id);
                  }}
                  accessibilityRole="button"
                >
                  <Text style={[styles.buttonLabel, !alert && styles.buttonLabelInfo, confirm && styles.buttonLabelConfirm]}>
                    {confirm ? 'Toque de novo: reduz as cargas dos seus treinos' : r.action.label}
                  </Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={() => {
                  setConfirming(null);
                  onDismiss(r.id);
                }}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Dispensar: ${r.title}`}
              >
                <Text style={styles.dismiss}>{confirm ? 'Cancelar' : r.action ? 'Agora não' : 'Entendi'}</Text>
              </Pressable>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: 22, marginBottom: 10, fontSize: 15, fontWeight: '700', color: colors.navy700 },
  card: { borderRadius: radii.card, padding: 14, marginBottom: 10 },
  cardAlert: { backgroundColor: '#FEF6E0', borderLeftWidth: 4, borderLeftColor: colors.amber },
  cardInfo: { backgroundColor: colors.surface, borderLeftWidth: 4, borderLeftColor: colors.teal500 },
  title: { fontSize: 15, fontWeight: '700', color: colors.ink },
  titleAlert: { color: AMBER_TEXT },
  text: { fontSize: 13, lineHeight: 19, color: colors.ink, marginTop: 4 },
  actions: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginTop: 12 },
  button: { minHeight: 40, paddingHorizontal: 14, borderRadius: radii.card, alignItems: 'center', justifyContent: 'center' },
  buttonAlert: { borderWidth: 1.5, borderColor: AMBER_TEXT },
  buttonInfo: { backgroundColor: colors.teal500 },
  buttonConfirm: { backgroundColor: colors.red500, borderColor: colors.red500 },
  buttonLabel: { fontSize: 14, fontWeight: '700', color: AMBER_TEXT, textAlign: 'center' },
  buttonLabelInfo: { color: colors.surface },
  buttonLabelConfirm: { color: colors.surface },
  dismiss: { fontSize: 13, fontWeight: '600', color: colors.gray500, minHeight: minTouchTarget / 2, paddingVertical: 6 },
});
