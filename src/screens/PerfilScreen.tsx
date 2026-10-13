import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NavBar } from '../components/NavBar';
import { colors, minTouchTarget, radii, screenPaddingHorizontal } from '../theme/tokens';
import { useWorkout } from '../context/WorkoutContext';
import { generateProgram } from '../data/programGenerator';
import { parseWeight } from '../data/bodyWeight';
import { daysAfterFrequencyChange } from '../data/trainingDays';
import { requestRestAlertPermission } from '../utils/restNotification';
import { useCloudSync } from '../context/CloudSyncContext';
import { Goal, Level, Sex } from '../types';

const goalLabel: Record<Goal, string> = {
  'ganhar-massa': 'Ganhar massa',
  'perder-gordura': 'Perder gordura',
  'manter-forma': 'Manter forma',
};
const goalOrder: Goal[] = ['ganhar-massa', 'perder-gordura', 'manter-forma'];

const levelLabel: Record<Level, string> = {
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
};
const levelOrder: Level[] = ['iniciante', 'intermediario', 'avancado'];

const sexLabel: Record<Sex, string> = {
  masculino: 'Masculino',
  feminino: 'Feminino',
  'prefiro-nao-dizer': 'Prefiro não dizer',
};
const sexOrder: Sex[] = ['masculino', 'feminino', 'prefiro-nao-dizer'];

function cycle<T>(order: T[], current: T): T {
  const i = order.indexOf(current);
  return order[(i + 1) % order.length];
}

export function PerfilScreen() {
  const navigation = useNavigation<any>();
  const cloud = useCloudSync();
  const { profile, settings, workouts, updateSettings, completeOnboarding, resetOnboarding, applyProgram, logWeight, currentWeightKg } = useWorkout();
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const [regenerated, setRegenerated] = useState<string | null>(null);
  const [weightKg, setWeightKg] = useState(String(currentWeightKg));
  // O peso também muda pelo Painel (registro de pesagem): mantém o campo em dia.
  useEffect(() => setWeightKg(String(currentWeightKg)), [currentWeightKg]);
  const [heightCm, setHeightCm] = useState(String(profile?.heightCm ?? ''));
  const [age, setAge] = useState(String(profile?.age ?? ''));

  if (!profile) {
    // Só acontece se o onboarding for pulado por algum motivo — defensivo.
    return (
      <View style={styles.screen}>
        <NavBar title="Perfil" />
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Nenhum perfil configurado ainda.</Text>
          <Pressable onPress={resetOnboarding}>
            <Text style={styles.emptyLink}>Fazer onboarding</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('Backup')}>
            <Text style={styles.emptyLink}>Restaurar um backup</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const saveField = (patch: Partial<typeof profile>) => {
    completeOnboarding({ ...profile, ...patch });
    // Mudar um dado invalida a confirmação e o aviso do programa anterior.
    setConfirmRegenerate(false);
    setRegenerated(null);
  };

  const handleRegenerate = () => {
    if (!confirmRegenerate) {
      setConfirmRegenerate(true);
      return;
    }
    // O descanso padrão não é mexido aqui: quem já ajustou no Perfil mantém a escolha.
    const program = generateProgram(profile);
    applyProgram(program.workouts);
    setConfirmRegenerate(false);
    setRegenerated(`${program.workouts.length} treinos criados: ${program.split}.`);
  };

  return (
    <View style={styles.screen}>
      <NavBar title="Perfil" />
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <Text style={styles.sectionLabel}>DADOS</Text>
        <View style={styles.card}>
          <Row label="Objetivo" value={goalLabel[profile.goal]} onPress={() => saveField({ goal: cycle(goalOrder, profile.goal) })} />
          <Row
            label="Nível"
            value={levelLabel[profile.level]}
            onPress={() => saveField({ level: cycle(levelOrder, profile.level) })}
            divider
          />
          <Row
            label="Sexo"
            value={sexLabel[profile.sex]}
            onPress={() => saveField({ sex: cycle(sexOrder, profile.sex) })}
            divider
          />
          <View style={[styles.row, styles.rowDivider]}>
            <Text style={styles.rowLabel}>Peso (kg)</Text>
            <TextInput
              value={weightKg}
              onChangeText={setWeightKg}
              onEndEditing={() => {
                const kg = parseWeight(weightKg);
                if (kg === null) setWeightKg(String(currentWeightKg));
                else if (kg !== currentWeightKg) logWeight(kg);
              }}
              keyboardType="numeric"
              style={styles.rowInput}
            />
          </View>
          <View style={[styles.row, styles.rowDivider]}>
            <Text style={styles.rowLabel}>Altura (cm)</Text>
            <TextInput
              value={heightCm}
              onChangeText={setHeightCm}
              onEndEditing={() => saveField({ heightCm: Number(heightCm) || profile.heightCm })}
              keyboardType="numeric"
              style={styles.rowInput}
            />
          </View>
          <View style={[styles.row, styles.rowDivider]}>
            <Text style={styles.rowLabel}>Idade</Text>
            <TextInput
              value={age}
              onChangeText={setAge}
              onEndEditing={() => saveField({ age: Number(age) || profile.age })}
              keyboardType="numeric"
              style={styles.rowInput}
            />
          </View>
          <Row
            label="Frequência"
            value={`${profile.frequencyPerWeek}x por semana`}
            onPress={() => {
              const next = profile.frequencyPerWeek >= 6 ? 2 : profile.frequencyPerWeek + 1;
              const days = daysAfterFrequencyChange(settings.diasTreino, profile.frequencyPerWeek, next);
              if (days) updateSettings({ diasTreino: days });
              saveField({ frequencyPerWeek: next });
            }}
            divider
          />
        </View>

        <Text style={styles.sectionLabel}>PROGRAMA</Text>
        <View style={styles.card}>
          <View style={styles.programBox}>
            <Text style={styles.programText}>
              Você tem {workouts.length} {workouts.length === 1 ? 'treino' : 'treinos'}. Depois de mudar objetivo, nível ou
              frequência, gere um programa novo com esses dados.
            </Text>
            <Pressable
              style={[styles.regenButton, confirmRegenerate && styles.regenButtonConfirm]}
              onPress={handleRegenerate}
              accessibilityRole="button"
            >
              <Text style={[styles.regenLabel, confirmRegenerate && styles.regenLabelConfirm]}>
                {confirmRegenerate ? 'Toque de novo: substitui seus treinos atuais' : 'Gerar programa pelo perfil'}
              </Text>
            </Pressable>
            {confirmRegenerate ? (
              <Pressable onPress={() => setConfirmRegenerate(false)} style={styles.cancelLink}>
                <Text style={styles.cancelLabel}>Cancelar</Text>
              </Pressable>
            ) : null}
            {regenerated ? <Text style={styles.regenDone}>{regenerated} O histórico foi mantido.</Text> : null}
          </View>
        </View>

        <Text style={styles.sectionLabel}>PREFERÊNCIAS</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Descanso padrão</Text>
            <View style={styles.stepper}>
              <Pressable
                style={styles.stepperButton}
                onPress={() => updateSettings({ descansoSegundos: Math.max(30, settings.descansoSegundos - 15) })}
              >
                <Text style={styles.stepperButtonLabel}>−</Text>
              </Pressable>
              <Text style={styles.stepperValue}>{settings.descansoSegundos}s</Text>
              <Pressable
                style={styles.stepperButton}
                onPress={() => updateSettings({ descansoSegundos: Math.min(300, settings.descansoSegundos + 15) })}
              >
                <Text style={styles.stepperButtonLabel}>+</Text>
              </Pressable>
            </View>
          </View>
          <View style={[styles.row, styles.rowDivider]}>
            <Text style={styles.rowLabel}>Avisar o fim do descanso</Text>
            <Switch
              value={settings.alertaDescanso !== false}
              onValueChange={(v) => {
                updateSettings({ alertaDescanso: v });
                if (v) void requestRestAlertPermission();
              }}
              trackColor={{ true: colors.teal500, false: colors.fill100 }}
              accessibilityLabel="Avisar o fim do descanso com notificação"
            />
          </View>
        </View>

        <Text style={styles.sectionLabel}>BACKUP E CONTA</Text>
        <View style={styles.card}>
          <Row
            label="Conta e sincronização"
            value={!cloud.configured ? 'Desligada' : cloud.user ? cloud.user.email : 'Entrar'}
            onPress={() => navigation.navigate('Conta')}
          />
          <Row label="Backup e restauração" value="Exportar ou importar" onPress={() => navigation.navigate('Backup')} divider />
        </View>

        <Pressable style={styles.onboardingLink} onPress={resetOnboarding}>
          <Text style={styles.onboardingLinkLabel}>Refazer onboarding</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Row({ label, value, onPress, divider }: { label: string; value: string; onPress: () => void; divider?: boolean }) {
  return (
    <Pressable style={[styles.row, divider && styles.rowDivider]} onPress={onPress}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.fill50 },
  body: { flex: 1 },
  bodyContent: { padding: screenPaddingHorizontal, paddingBottom: 32 },
  sectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.96, color: colors.gray500, marginBottom: 8, marginTop: 8 },
  card: { backgroundColor: colors.surface, borderRadius: radii.card, overflow: 'hidden', marginBottom: 22 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14, minHeight: minTouchTarget },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.divider },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.ink },
  rowValue: { fontSize: 14, color: colors.gray500 },
  rowInput: { fontSize: 15, color: colors.ink, minWidth: 60, textAlign: 'right' },
  chevron: { color: colors.gray300, fontSize: 17 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepperButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.fill100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonLabel: { fontSize: 16, fontWeight: '700', color: colors.navy700 },
  stepperValue: { fontSize: 14, fontWeight: '600', color: colors.ink, minWidth: 36, textAlign: 'center' },
  programBox: { padding: 14, gap: 10 },
  programText: { fontSize: 13, lineHeight: 18, color: colors.gray500 },
  regenButton: {
    minHeight: minTouchTarget,
    borderRadius: radii.card,
    borderWidth: 1.5,
    borderColor: colors.teal500,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  regenButtonConfirm: { backgroundColor: colors.red500, borderColor: colors.red500 },
  regenLabel: { fontSize: 14, fontWeight: '700', color: colors.teal500, textAlign: 'center' },
  regenLabelConfirm: { color: colors.surface },
  cancelLink: { alignItems: 'center', paddingVertical: 4 },
  cancelLabel: { fontSize: 13, fontWeight: '600', color: colors.gray500 },
  regenDone: { fontSize: 13, fontWeight: '600', color: colors.teal600 },
  onboardingLink: { alignItems: 'center', paddingVertical: 12 },
  onboardingLinkLabel: { fontSize: 14, fontWeight: '600', color: colors.teal500 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 40 },
  emptyText: { fontSize: 15, color: colors.gray500, textAlign: 'center' },
  emptyLink: { fontSize: 14, fontWeight: '600', color: colors.teal500 },
});
