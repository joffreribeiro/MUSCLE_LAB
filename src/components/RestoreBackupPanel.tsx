import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, minTouchTarget, radii } from '../theme/tokens';
import { useWorkout } from '../context/WorkoutContext';
import { Backup, parseBackup, summarizeBackup } from '../data/backup';
import { formatSessionDate } from '../utils/format';

const isWeb = Platform.OS === 'web';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Abre o seletor de arquivos e devolve o texto escolhido (só na web). */
function pickTextFile(): Promise<string | null> {
  const g = globalThis as any;
  return new Promise((resolve) => {
    const input = g.document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = async () => {
      const file = input.files?.[0];
      resolve(file ? await file.text() : null);
    };
    input.click();
  });
}

/**
 * Restaurar um backup: escolher o arquivo (web) ou colar o texto, conferir e só então substituir os
 * dados. Usado na tela de Backup e no primeiro acesso ao app (celular novo).
 */
export function RestoreBackupPanel({ replaceWarning = true }: { replaceWarning?: boolean }) {
  const { restoreBackup } = useWorkout();
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Backup | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const check = (raw: string) => {
    setMessage(null);
    if (!raw.trim()) {
      setError('Cole o conteúdo do backup ou escolha o arquivo.');
      setPending(null);
      return;
    }
    const result = parseBackup(raw);
    if (!result.ok) {
      setError(result.error);
      setPending(null);
      return;
    }
    setError(null);
    setPending(result.backup);
  };

  const handlePick = async () => {
    const content = await pickTextFile();
    if (content === null) return;
    setText(content);
    check(content);
  };

  const handleRestore = () => {
    if (!pending) return;
    restoreBackup(pending.data);
    setPending(null);
    setText('');
    setMessage('Backup restaurado. Seus treinos, histórico e pesagens foram substituídos.');
  };

  const summary = pending ? summarizeBackup(pending.data) : null;

  return (
    <View>
      <View style={styles.card}>
        <Text style={styles.text}>
          {isWeb ? 'Escolha o arquivo do backup ou cole o conteúdo abaixo.' : 'Cole abaixo o conteúdo do backup que você guardou.'}
        </Text>
        {isWeb ? (
          <Pressable style={styles.secondaryButton} onPress={handlePick} accessibilityRole="button">
            <Text style={styles.secondaryLabel}>Escolher arquivo</Text>
          </Pressable>
        ) : null}
        <TextInput
          value={text}
          onChangeText={(t) => {
            setText(t);
            setPending(null);
            setError(null);
          }}
          placeholder="Conteúdo do backup"
          placeholderTextColor={colors.gray400}
          multiline
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.textArea}
          accessibilityLabel="Conteúdo do backup"
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!pending ? (
          <Pressable style={styles.secondaryButton} onPress={() => check(text)} accessibilityRole="button">
            <Text style={styles.secondaryLabel}>Verificar backup</Text>
          </Pressable>
        ) : (
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>Backup válido</Text>
            <Text style={styles.text}>
              {plural(summary!.workouts, 'treino', 'treinos')}, {plural(summary!.sessions, 'treino concluído', 'treinos concluídos')} e{' '}
              {plural(summary!.weights, 'pesagem', 'pesagens')}
              {summary!.lastSessionISO ? `. Último treino em ${formatSessionDate(new Date(summary!.lastSessionISO))}` : ''}.
            </Text>
            {replaceWarning ? (
              <Text style={styles.warning}>Isto substitui todos os dados atuais do app. Faça um backup antes se quiser guardá-los.</Text>
            ) : null}
            <Pressable style={styles.dangerButton} onPress={handleRestore} accessibilityRole="button">
              <Text style={styles.dangerLabel}>{replaceWarning ? 'Substituir meus dados' : 'Restaurar meus dados'}</Text>
            </Pressable>
            <Pressable onPress={() => setPending(null)} style={styles.cancel} hitSlop={8}>
              <Text style={styles.cancelLabel}>Cancelar</Text>
            </Pressable>
          </View>
        )}
      </View>
      {message ? <Text style={styles.success}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radii.card, padding: 14, marginBottom: 18, gap: 10 },
  text: { fontSize: 14, lineHeight: 20, color: colors.ink },
  secondaryButton: {
    minHeight: minTouchTarget,
    borderRadius: radii.card,
    borderWidth: 1.5,
    borderColor: colors.teal500,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  secondaryLabel: { fontSize: 14, fontWeight: '700', color: colors.teal500 },
  textArea: {
    minHeight: 110,
    maxHeight: 220,
    borderRadius: radii.card,
    backgroundColor: colors.fill50,
    padding: 12,
    fontSize: 13,
    color: colors.ink,
    textAlignVertical: 'top',
  },
  error: { fontSize: 13, lineHeight: 18, color: colors.red500 },
  confirmBox: { gap: 8 },
  confirmTitle: { fontSize: 15, fontWeight: '700', color: colors.teal600 },
  warning: { fontSize: 13, lineHeight: 18, color: colors.red900, backgroundColor: colors.red50, borderRadius: radii.card, padding: 10 },
  dangerButton: { minHeight: minTouchTarget, borderRadius: radii.card, backgroundColor: colors.red500, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  dangerLabel: { fontSize: 14, fontWeight: '700', color: colors.surface },
  cancel: { alignSelf: 'center', paddingVertical: 8 },
  cancelLabel: { fontSize: 14, fontWeight: '600', color: colors.gray500 },
  success: { fontSize: 14, fontWeight: '600', lineHeight: 20, color: colors.teal600, textAlign: 'center' },
});
