import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NavBar } from '../components/NavBar';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors, minTouchTarget, radii, screenPaddingHorizontal } from '../theme/tokens';
import { useCloudSync } from '../context/CloudSyncContext';
import { validateCredentials } from '../data/cloudErrors';
import { formatSessionDate, formatHHmm } from '../utils/format';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function ContaScreen() {
  const navigation = useNavigation<any>();
  const { configured, user, status, message, lastSyncISO, conflict, signIn, signUp, signOut, syncNow, resolveConflict } = useCloudSync();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  const submit = async (mode: 'entrar' | 'criar') => {
    setNotice(null);
    const problem = validateCredentials(email, password);
    setFormError(problem);
    if (problem) return;
    setWorking(true);
    if (mode === 'entrar') {
      await signIn(email, password);
    } else {
      const r = await signUp(email, password);
      if (r.ok && r.needsConfirmation) setNotice('Conta criada. Enviamos um link de confirmação para o seu e-mail; confirme e depois toque em "Entrar".');
    }
    setPassword('');
    setWorking(false);
  };

  const when = (iso: string) => {
    const d = new Date(iso);
    return `${formatSessionDate(d)} às ${formatHHmm(d)}`;
  };

  return (
    <View style={styles.screen}>
      <NavBar
        left={
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <Text style={styles.backLink}>← Perfil</Text>
          </Pressable>
        }
        title="Conta e sincronização"
      />
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} keyboardShouldPersistTaps="handled">
        {!configured ? (
          <View style={styles.card}>
            <Text style={styles.title}>Sincronização desligada</Text>
            <Text style={styles.text}>
              Com uma conta, seus treinos e histórico ficam guardados na nuvem e aparecem em qualquer aparelho em que você entrar. Para ligar,
              o app precisa estar conectado a um projeto Supabase. O passo a passo está no arquivo supabase/LEIAME.md.
            </Text>
            <Text style={styles.hint}>Enquanto isso, use o backup por arquivo em Perfil → Backup.</Text>
          </View>
        ) : !user ? (
          <View style={styles.card}>
            <Text style={styles.title}>Entrar ou criar conta</Text>
            <Text style={styles.text}>Seus dados ficam ligados ao seu e-mail e podem ser abertos em outros aparelhos.</Text>
            <TextInput
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                setFormError(null);
              }}
              placeholder="E-mail"
              placeholderTextColor={colors.gray400}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              style={styles.input}
              accessibilityLabel="E-mail"
            />
            <TextInput
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                setFormError(null);
              }}
              placeholder="Senha (mínimo 6 caracteres)"
              placeholderTextColor={colors.gray400}
              secureTextEntry
              autoCapitalize="none"
              textContentType="password"
              style={styles.input}
              accessibilityLabel="Senha"
            />
            {formError || message ? <Text style={styles.error}>{formError ?? message}</Text> : null}
            {notice ? <Text style={styles.success}>{notice}</Text> : null}
            <PrimaryButton label={working ? 'Aguarde…' : 'Entrar'} onPress={() => !working && submit('entrar')} />
            <Pressable style={styles.secondary} onPress={() => !working && submit('criar')} accessibilityRole="button">
              <Text style={styles.secondaryLabel}>Criar conta</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.caption}>CONECTADO COMO</Text>
              <Text style={styles.email}>{user.email}</Text>
              <Text style={styles.statusLine}>
                {status === 'sincronizando'
                  ? 'Sincronizando…'
                  : status === 'conflito'
                    ? 'Conflito: escolha qual versão manter.'
                    : status === 'erro'
                      ? 'Não foi possível sincronizar.'
                      : lastSyncISO
                        ? `Sincronizado em ${when(lastSyncISO)}`
                        : 'Ainda não sincronizado.'}
              </Text>
              {message ? <Text style={styles.error}>{message}</Text> : null}
              <PrimaryButton label="Sincronizar agora" onPress={() => void syncNow()} />
              <Text style={styles.hint}>A sincronização acontece sozinha ao abrir o app, ao voltar para ele e logo depois de você registrar algo.</Text>
            </View>

            {conflict ? (
              <View style={[styles.card, styles.conflict]}>
                <Text style={styles.conflictTitle}>Os dois lados têm dados diferentes</Text>
                <Text style={styles.text}>
                  Neste aparelho: {plural(conflict.local.sessions, 'treino concluído', 'treinos concluídos')} e {plural(conflict.local.weights, 'pesagem', 'pesagens')}.{'\n'}
                  Na nuvem: {plural(conflict.cloud.sessions, 'treino concluído', 'treinos concluídos')} e {plural(conflict.cloud.weights, 'pesagem', 'pesagens')}.
                </Text>
                <Text style={styles.hint}>Nada foi apagado. Escolher uma versão substitui a outra.</Text>
                <PrimaryButton label="Manter os dados deste aparelho" onPress={() => void resolveConflict('local')} />
                <Pressable style={styles.secondary} onPress={() => void resolveConflict('cloud')} accessibilityRole="button">
                  <Text style={styles.secondaryLabel}>Usar os dados da nuvem</Text>
                </Pressable>
              </View>
            ) : null}

            <Pressable
              style={styles.signOut}
              onPress={() => {
                if (!confirmSignOut) {
                  setConfirmSignOut(true);
                  return;
                }
                setConfirmSignOut(false);
                void signOut();
              }}
              accessibilityRole="button"
            >
              <Text style={styles.signOutLabel}>{confirmSignOut ? 'Toque de novo para sair (os dados ficam neste aparelho)' : 'Sair da conta'}</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.fill50 },
  backLink: { fontSize: 15, color: colors.teal500 },
  body: { flex: 1 },
  bodyContent: { padding: screenPaddingHorizontal, paddingBottom: 32, gap: 14 },
  card: { backgroundColor: colors.surface, borderRadius: radii.card, padding: 14, gap: 10 },
  title: { fontSize: 17, fontWeight: '700', color: colors.navy700 },
  text: { fontSize: 14, lineHeight: 20, color: colors.ink },
  hint: { fontSize: 12, lineHeight: 17, color: colors.gray500 },
  caption: { fontSize: 11, fontWeight: '700', letterSpacing: 0.9, color: colors.gray500 },
  email: { fontSize: 16, fontWeight: '700', color: colors.ink },
  statusLine: { fontSize: 13, color: colors.gray500 },
  input: { minHeight: minTouchTarget, borderRadius: radii.card, backgroundColor: colors.fill50, paddingHorizontal: 12, fontSize: 15, color: colors.ink },
  error: { fontSize: 13, lineHeight: 18, color: colors.red500 },
  success: { fontSize: 13, lineHeight: 18, fontWeight: '600', color: colors.teal600 },
  secondary: { minHeight: minTouchTarget, borderRadius: radii.card, borderWidth: 1.5, borderColor: colors.teal500, alignItems: 'center', justifyContent: 'center' },
  secondaryLabel: { fontSize: 14, fontWeight: '700', color: colors.teal500 },
  conflict: { backgroundColor: '#FEF6E0', borderLeftWidth: 4, borderLeftColor: colors.amber },
  conflictTitle: { fontSize: 15, fontWeight: '700', color: '#9A7413' },
  signOut: { alignSelf: 'center', paddingVertical: 12 },
  signOutLabel: { fontSize: 14, fontWeight: '600', color: colors.red500, textAlign: 'center' },
});
