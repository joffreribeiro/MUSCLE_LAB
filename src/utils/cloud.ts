import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import * as firebaseAuth from 'firebase/auth';
import {
  Auth,
  createUserWithEmailAndPassword,
  getAuth,
  initializeAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
} from 'firebase/auth';
import { doc, getDoc, getFirestore, setDoc } from 'firebase/firestore';
import { Backup } from '../data/backup';
import { CloudApi, RemoteSnapshot } from '../data/cloudSync';

// Conexão com o Firebase: login (e-mail e senha) e leitura/gravação da cópia dos dados da conta no
// Firestore. A configuração vem de variáveis EXPO_PUBLIC_FIREBASE_* (arquivo .env). Essas chaves são
// públicas por desenho; quem protege os dados são as regras do Firestore (firebase/firestore.rules).

const config = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

/** A conta e a sincronização só existem quando o Firebase está configurado. */
export const cloudConfigured = Boolean(config.apiKey && config.projectId && config.appId);

/** O botão "Criar conta" só aparece com EXPO_PUBLIC_FIREBASE_ALLOW_SIGNUP=1; por padrão as contas são criadas no console do Firebase. */
export const signUpAllowed = process.env.EXPO_PUBLIC_FIREBASE_ALLOW_SIGNUP === '1';

/** Coleção que guarda uma cópia completa por conta (documento = id do usuário). */
const COLLECTION = 'muscleLabBackups';

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;

function getFirebaseApp(): FirebaseApp {
  if (!cloudConfigured) throw new Error('Sincronização não configurada.');
  if (!app) app = getApps().length === 0 ? initializeApp(config) : getApp();
  return app;
}

function getAuthInstance(): Auth {
  if (!authInstance) {
    const a = getFirebaseApp();
    if (Platform.OS === 'web') {
      authInstance = getAuth(a);
    } else {
      // getReactNativePersistence só existe no bundle React Native do firebase (não está nos tipos).
      const persistence = (firebaseAuth as any).getReactNativePersistence(AsyncStorage);
      authInstance = initializeAuth(a, { persistence });
    }
  }
  return authInstance;
}

export interface CloudUser {
  id: string;
  email: string;
}

const toUser = (u: { uid: string; email?: string | null } | null | undefined): CloudUser | null =>
  u ? { id: u.uid, email: u.email ?? '' } : null;

/** Usuário já conectado neste aparelho, se houver. */
export async function currentUser(): Promise<CloudUser | null> {
  if (!cloudConfigured) return null;
  const auth = getAuthInstance();
  await auth.authStateReady();
  return toUser(auth.currentUser);
}

/** Avisa quando o login muda (entrar, sair, sessão expirada). Devolve a função que cancela. */
export function onUserChange(callback: (user: CloudUser | null) => void): () => void {
  if (!cloudConfigured) return () => {};
  return onAuthStateChanged(getAuthInstance(), (u) => callback(toUser(u)));
}

export async function signIn(email: string, password: string): Promise<CloudUser> {
  const cred = await signInWithEmailAndPassword(getAuthInstance(), email.trim(), password);
  return toUser(cred.user)!;
}

/** Cria a conta e já entra nela (o Firebase não exige confirmar o e-mail antes). */
export async function signUp(email: string, password: string): Promise<{ user: CloudUser | null; needsConfirmation: boolean }> {
  const cred = await createUserWithEmailAndPassword(getAuthInstance(), email.trim(), password);
  return { user: toUser(cred.user), needsConfirmation: false };
}

export async function signOut(): Promise<void> {
  await fbSignOut(getAuthInstance());
}

/** Envia o e-mail para criar uma nova senha. */
export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(getAuthInstance(), email.trim());
}

/** Acesso à cópia dos dados da conta `userId`. O backup vai como texto JSON (o Firestore não aceita listas dentro de listas). */
export function makeCloudApi(userId: string): CloudApi {
  const ref = () => doc(getFirestore(getFirebaseApp()), COLLECTION, userId);
  return {
    async fetchRemote(): Promise<RemoteSnapshot | null> {
      const snap = await getDoc(ref());
      if (!snap.exists()) return null;
      const d = snap.data() as { data?: string; updatedAt?: string };
      return { backup: d.data ?? '', updatedAt: d.updatedAt ?? '' };
    },
    async pushRemote(backup: Backup): Promise<string> {
      // A marca só é comparada por igualdade; o horário do aparelho com um sufixo aleatório basta.
      const updatedAt = `${new Date().toISOString()}#${Math.random().toString(36).slice(2, 8)}`;
      await setDoc(ref(), { data: JSON.stringify(backup), updatedAt });
      return updatedAt;
    },
  };
}
