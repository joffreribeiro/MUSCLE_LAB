import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput } from 'react-native';
import { PrimaryButton } from './PrimaryButton';
import { colors, minTouchTarget, radii } from '../theme/tokens';
import { useCloudSync } from '../context/CloudSyncContext';
import { validateCredentials } from '../data/cloudErrors';
import { signUpAllowed } from '../utils/cloud';

/** Formulário de e-mail e senha: entrar ou criar conta. Usado na tela de login e em Conta e sincronização. */
export function AuthForm() {
  const { signIn, signUp, resetPassword, message } = useCloudSync();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  const submit = async (mode: 'entrar' | 'criar') => {
    if (working) return;
    setNotice(null);
    const problem = validateCredentials(email, password);
    setFormError(problem);
    if (problem) return;
    setWorking(true);
    if (mode === 'entrar') {
      await signIn(email, password);
    } else {
      const r = await signUp(email, password);
      if (r.ok && r.needsConfirmation) {
        setNotice('Conta criada. Enviamos um link de confirmação para o seu e-mail; confirme e depois toque em "Entrar".');
      }
    }
    setPassword('');
    setWorking(false);
  };

  const forgot = async () => {
    if (working) return;
    setNotice(null);
    if (validateCredentials(email, '123456')) {
      setFormError('Digite seu e-mail acima para receber o link de nova senha.');
      return;
    }
    setFormError(null);
    setWorking(true);
    const ok = await resetPassword(email);
    if (ok) setNotice('Se este e-mail tiver conta, enviamos um link para criar uma nova senha. Olhe também a caixa de spam.');
    setWorking(false);
  };

  return (
    <>
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
        autoComplete="email"
        style={styles.input}
        accessibilityLabel="E-mail"
      />
      <TextInput
        value={password}
        onChangeText={(t) => {
          setPassword(t);
          setFormError(null);
        }}
        onSubmitEditing={() => void submit('entrar')}
        placeholder="Senha (mínimo 6 caracteres)"
        placeholderTextColor={colors.gray400}
        secureTextEntry
        autoCapitalize="none"
        textContentType="password"
        autoComplete="current-password"
        style={styles.input}
        accessibilityLabel="Senha"
      />
      {formError || message ? <Text style={styles.error}>{formError ?? message}</Text> : null}
      {notice ? <Text style={styles.success}>{notice}</Text> : null}
      <PrimaryButton label={working ? 'Aguarde…' : 'Entrar'} onPress={() => void submit('entrar')} />
      {signUpAllowed ? (
        <Pressable style={styles.secondary} onPress={() => void submit('criar')} accessibilityRole="button">
          <Text style={styles.secondaryLabel}>Criar conta</Text>
        </Pressable>
      ) : null}
      <Pressable style={styles.forgot} onPress={() => void forgot()} accessibilityRole="button">
        <Text style={styles.forgotLabel}>Esqueci a senha</Text>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  input: { minHeight: minTouchTarget, borderRadius: radii.card, backgroundColor: colors.fill50, paddingHorizontal: 12, fontSize: 15, color: colors.ink },
  error: { fontSize: 13, lineHeight: 18, color: colors.red500 },
  success: { fontSize: 13, lineHeight: 18, fontWeight: '600', color: colors.teal600 },
  secondary: { minHeight: minTouchTarget, borderRadius: radii.card, borderWidth: 1.5, borderColor: colors.teal500, alignItems: 'center', justifyContent: 'center' },
  secondaryLabel: { fontSize: 14, fontWeight: '700', color: colors.teal500 },
  forgot: { alignSelf: 'center', paddingVertical: 8 },
  forgotLabel: { fontSize: 13, fontWeight: '600', color: colors.gray500 },
});
