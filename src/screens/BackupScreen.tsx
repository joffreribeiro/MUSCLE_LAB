import React, { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NavBar } from '../components/NavBar';
import { PrimaryButton } from '../components/PrimaryButton';
import { RestoreBackupPanel } from '../components/RestoreBackupPanel';
import { colors, minTouchTarget, radii, screenPaddingHorizontal } from '../theme/tokens';
import { useWorkout } from '../context/WorkoutContext';
import { backupFileName, buildBackup, summarizeBackup } from '../data/backup';

const isWeb = Platform.OS === 'web';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Baixa o texto como arquivo (só na web). */
function downloadText(fileName: string, text: string) {
  const g = globalThis as any;
  const url = g.URL.createObjectURL(new g.Blob([text], { type: 'application/json' }));
  const link = g.document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  g.URL.revokeObjectURL(url);
}

export function BackupScreen() {
  const navigation = useNavigation<any>();
  const { workouts, activeWorkout, sessions, comments, settings, profile, onboardingComplete, weights, measures, activeProgram } = useWorkout();
  const [message, setMessage] = useState<string | null>(null);

  const current = useMemo(
    () => ({
      workouts,
      activeWorkoutId: activeWorkout?.id ?? '',
      sessions,
      comments,
      settings,
      profile,
      onboardingComplete,
      weights,
      measures,
      activeProgram,
    }),
    [workouts, activeWorkout, sessions, comments, settings, profile, onboardingComplete, weights, measures, activeProgram],
  );
  const summary = summarizeBackup(current);

  const handleExport = async () => {
    const now = new Date();
    const json = JSON.stringify(buildBackup(current, now), null, 2);
    setMessage(null);
    if (isWeb) {
      downloadText(backupFileName(now), json);
      setMessage('Backup baixado. Guarde o arquivo em um lugar seguro.');
      return;
    }
    try {
      await Share.share({ title: backupFileName(now), message: json });
    } catch {
      setMessage('Não foi possível abrir o compartilhamento.');
    }
  };

  return (
    <View style={styles.screen}>
      <NavBar
        left={
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <Text style={styles.backLink}>← Perfil</Text>
          </Pressable>
        }
        title="Backup"
      />
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionLabel}>EXPORTAR</Text>
        <View style={styles.card}>
          <Text style={styles.text}>
            Seus dados ficam só neste aparelho. Guarde uma cópia para não perder o histórico se trocar de celular ou limpar o app.
          </Text>
          <Text style={styles.facts}>
            {plural(summary.workouts, 'treino', 'treinos')} · {plural(summary.sessions, 'treino concluído', 'treinos concluídos')} ·{' '}
            {plural(summary.weights, 'pesagem', 'pesagens')}
          </Text>
          <PrimaryButton label={isWeb ? 'Baixar backup' : 'Compartilhar backup'} onPress={handleExport} style={styles.button} />
          {!isWeb ? <Text style={styles.hint}>Envie para você mesmo (e-mail, nuvem ou notas) ou escolha "Copiar".</Text> : null}
        </View>

        {message ? <Text style={styles.success}>{message}</Text> : null}

        <Text style={styles.sectionLabel}>RESTAURAR</Text>
        <RestoreBackupPanel />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.fill50 },
  backLink: { fontSize: 15, color: colors.teal500 },
  body: { flex: 1 },
  bodyContent: { padding: screenPaddingHorizontal, paddingBottom: 32 },
  sectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.96, color: colors.gray500, marginBottom: 8, marginTop: 8 },
  card: { backgroundColor: colors.surface, borderRadius: radii.card, padding: 14, marginBottom: 18, gap: 10 },
  text: { fontSize: 14, lineHeight: 20, color: colors.ink },
  facts: { fontSize: 13, color: colors.gray500 },
  hint: { fontSize: 12, lineHeight: 17, color: colors.gray500 },
  button: { marginTop: 2 },
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
