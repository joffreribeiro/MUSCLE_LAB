import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NavBar } from '../components/NavBar';
import { ExerciseMedia } from '../components/ExerciseMedia';
import { Icon } from '../components/icons/Icon';
import { Chip } from '../components/Chip';
import { EvolutionSection } from '../components/EvolutionSection';
import { ExerciseHistory } from '../components/ExerciseHistory';
import { MediaViewer } from '../components/MediaViewer';
import { MuscleSection } from '../components/MuscleSection';
import { colors, radii, screenPaddingHorizontal } from '../theme/tokens';
import { catalog, findExerciseById } from '../data/catalog';
import { getKinesiology } from '../data/muscles';
import { getExerciseMedia } from '../data/media';

type Tab = 'info' | 'musculos' | 'progresso' | 'historico';
const TABS: { key: Tab; label: string }[] = [
  { key: 'info', label: 'Informações' },
  { key: 'musculos', label: 'Músculos' },
  { key: 'progresso', label: 'Progresso' },
  { key: 'historico', label: 'Histórico' },
];

export function FichaScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const exercise = findExerciseById(route.params.exerciseId);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('info');

  if (!exercise) return null;

  const groupName = catalog[exercise.muscleGroup].name;
  const media = getExerciseMedia(exercise.id);
  const kin = getKinesiology(exercise.id);

  return (
    <View style={styles.screen}>
      <NavBar
        left={
          <Pressable onPress={() => navigation.goBack()}>
            <Text style={styles.backLink}>← Exercícios</Text>
          </Pressable>
        }
        right={
          // Só há o que ampliar quando o exercício tem animação.
          media ? (
            <Pressable
              style={styles.playButton}
              onPress={() => setViewerOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Ver animação em tela cheia"
            >
              <Icon name="play" color={colors.surface} size={14} />
            </Pressable>
          ) : (
            <View style={{ width: 32 }} />
          )
        }
      />
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {TABS.map((t) => (
            <Chip key={t.key} label={t.label} active={tab === t.key} onPress={() => setTab(t.key)} />
          ))}
        </ScrollView>
      </View>
      <ScrollView style={styles.body} key={tab}>
        {tab === 'info' ? (
        <>
        <Pressable style={styles.illustration} onPress={media ? () => setViewerOpen(true) : undefined} disabled={!media}>
          <ExerciseMedia
            exerciseId={exercise.id}
            placeholderWidth={76}
            placeholderHeight={106}
            placeholderCaption="SEM ANIMAÇÃO DISPONÍVEL"
            placeholderHighlighted
            placeholderLimbColor={colors.gray200}
            fit="contain"
          />
        </Pressable>

        <View style={styles.content}>
          <Text style={styles.name}>{exercise.name}</Text>
          <Text style={styles.group}>{groupName}</Text>

          <View style={styles.sectionHeader}>
            <View style={styles.infoButton}>
              <Text style={styles.infoButtonLabel}>i</Text>
            </View>
            <Text style={styles.sectionTitle}>Descrição</Text>
          </View>
          <View style={styles.descCard}>
            <Text style={styles.descText}>{exercise.description}</Text>
          </View>

          {kin?.movimentos ? (
            <>
              <View style={styles.sectionHeader}>
                <Icon name="rotate" color={colors.navy700} size={18} />
                <Text style={styles.sectionTitle}>Movimento articular</Text>
              </View>
              <View style={styles.stepsCard}>
                {kin.movimentos.map((mov, i) => (
                  <View key={mov} style={[styles.stepRow, i > 0 && styles.rowDivider]}>
                    <View style={[styles.stepDot, styles.movDot]} />
                    <Text style={styles.stepText}>{mov}</Text>
                  </View>
                ))}
                {kin.plano ? (
                  <View style={[styles.stepRow, styles.rowDivider]}>
                    <Text style={styles.planoLabel}>PLANO</Text>
                    <Text style={styles.stepText}>{kin.plano}</Text>
                  </View>
                ) : null}
              </View>
            </>
          ) : null}

          <View style={styles.sectionHeader}>
            <Icon name="clipboard" color={colors.navy700} size={18} />
            <Text style={styles.sectionTitle}>Instrução</Text>
          </View>
          <View style={styles.stepsCard}>
            {exercise.steps.map((step, i) => (
              <View key={i} style={[styles.stepRow, i > 0 && styles.rowDivider]}>
                <View style={styles.stepDot} />
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>

          {kin?.erros ? (
            <>
              <View style={styles.sectionHeader}>
                <Icon name="close" color={colors.red500} size={18} />
                <Text style={styles.sectionTitle}>Erros comuns</Text>
              </View>
              <View style={styles.stepsCard}>
                {kin.erros.map((erro, i) => (
                  <View key={erro} style={[styles.stepRow, i > 0 && styles.rowDivider]}>
                    <View style={styles.erroIcon}><Icon name="close" color={colors.red500} size={14} strokeWidth={2.2} /></View>
                    <Text style={styles.stepText}>{erro}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          {kin?.dica ? (
            <View style={styles.dicaCard}>
              <View style={styles.calloutTitleRow}>
                <Icon name="star" color="#9A7413" size={16} />
                <Text style={styles.dicaTitle}>DICA DE OURO</Text>
              </View>
              <Text style={styles.dicaBody}>{kin.dica}</Text>
            </View>
          ) : null}

          <View style={styles.warnCard}>
            <View style={styles.calloutTitleRow}>
              <Icon name="warning" color={colors.red500} size={16} />
              <Text style={styles.warnTitle}>AVISO!</Text>
            </View>
            <Text style={styles.warnBody}>{exercise.warning}</Text>
          </View>
        </View>
        </>
        ) : null}

        {tab === 'musculos' ? (
          <View style={styles.tabBody}>
            <Text style={styles.tabTitle}>{exercise.name}</Text>
            <MuscleSection kinesiology={kin} />
          </View>
        ) : null}

        {tab === 'progresso' ? (
          <View style={styles.tabBody}>
            {exercise.muscleGroup !== 'cardio' ? (
              <EvolutionSection exerciseId={exercise.id} showEmpty />
            ) : (
              <Text style={styles.tabNote}>O progresso por carga vale para exercícios de força; no cardio, acompanhe o tempo no Histórico.</Text>
            )}
          </View>
        ) : null}

        {tab === 'historico' ? (
          <View style={styles.tabBody}>
            <ExerciseHistory exerciseId={exercise.id} />
          </View>
        ) : null}
      </ScrollView>
      <MediaViewer visible={viewerOpen} source={media} title={exercise.name} onClose={() => setViewerOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.fill50 },
  backLink: { fontSize: 15, color: colors.teal500 },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.teal500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playGlyph: { color: colors.surface, fontSize: 13 },
  body: { flex: 1 },
  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: screenPaddingHorizontal, paddingVertical: 10 },
  tabBody: { padding: screenPaddingHorizontal },
  tabTitle: { fontSize: 18, fontWeight: '700', color: colors.ink, marginBottom: 12 },
  tabNote: { fontSize: 14, lineHeight: 20, color: colors.gray500, padding: 16 },
  illustration: {
    height: 280,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    overflow: 'hidden',
  },
  content: { padding: screenPaddingHorizontal },
  name: { fontSize: 22, fontWeight: '700', lineHeight: 26, color: colors.ink },
  group: { fontSize: 13, color: colors.gray500, marginTop: 4 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 22, marginBottom: 8 },
  infoButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.teal500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoButtonLabel: { fontSize: 11, fontWeight: '700', color: colors.teal500 },
  clipboardGlyph: { fontSize: 14 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.navy700 },
  descCard: { backgroundColor: colors.surface, borderRadius: radii.card, padding: 14 },
  descText: { fontSize: 15, lineHeight: 22, color: colors.ink },
  stepsCard: { backgroundColor: colors.surface, borderRadius: radii.card, paddingHorizontal: 14 },
  stepRow: { flexDirection: 'row', gap: 10, paddingVertical: 10 },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.divider },
  stepDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.red500, marginTop: 7 },
  stepText: { flex: 1, fontSize: 15, lineHeight: 22 },
  movDot: { backgroundColor: colors.navy600 },
  planoLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.9, color: colors.gray500, marginTop: 4 },
  erroIcon: { marginTop: 3 },
  calloutTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  erroGlyph: { fontSize: 12, fontWeight: '700', color: colors.red500, marginTop: 3 },
  dicaCard: {
    marginTop: 22,
    backgroundColor: '#FEF6E0',
    borderLeftWidth: 3,
    borderLeftColor: colors.amber,
    borderRadius: radii.card,
    padding: 14,
  },
  dicaTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 0.8, color: '#9A7413' },
  dicaBody: { fontSize: 14, lineHeight: 20, color: colors.ink, marginTop: 6 },
  warnCard: { marginTop: 22, backgroundColor: colors.red50, borderRadius: radii.card, padding: 14 },
  warnTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 0.8, color: colors.red500 },
  warnBody: { fontSize: 14, lineHeight: 20, color: colors.red900, marginTop: 6 },
});
