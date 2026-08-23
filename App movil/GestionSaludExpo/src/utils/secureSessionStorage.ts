/**
 * @file App movil/GestionSaludExpo/src/utils/secureSessionStorage.ts
 * @description TypeScript module implementation.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export type StoredAuthUser = {
  id: number;
  username: string;
  role?: string;
  pacienteId?: number | null;
  pacienteIds?: number[];
};

export type StoredSession = {
  token: string;
  user: StoredAuthUser;
};

const LEGACY_SESSION_KEY = '@gs_auth_session';
const SESSION_USER_KEY = '@gs_auth_user';
const SESSION_TOKEN_KEY = 'gs_auth_token';
const WEB_SESSION_TOKEN_KEY = '@gs_auth_token_web';

const readToken = async (): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return AsyncStorage.getItem(WEB_SESSION_TOKEN_KEY);
  }
  return SecureStore.getItemAsync(SESSION_TOKEN_KEY);
};

const writeToken = async (token: string): Promise<void> => {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(WEB_SESSION_TOKEN_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(SESSION_TOKEN_KEY, token);
};

const removeToken = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(WEB_SESSION_TOKEN_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
};

export async function readStoredSession(): Promise<StoredSession | null> {
  const [token, rawUser] = await Promise.all([
    readToken(),
    AsyncStorage.getItem(SESSION_USER_KEY),
  ]);

  if (token && rawUser) {
    return {
      token,
      user: JSON.parse(rawUser) as StoredAuthUser,
    };
  }

  // Migra una sola vez las sesiones creadas antes de usar SecureStore.
  const legacyRaw = await AsyncStorage.getItem(LEGACY_SESSION_KEY);
  if (!legacyRaw) {
    return null;
  }

  const legacy = JSON.parse(legacyRaw) as StoredSession | null;
  if (!legacy?.token || !legacy.user) {
    await AsyncStorage.removeItem(LEGACY_SESSION_KEY);
    return null;
  }

  await writeStoredSession(legacy);
  await AsyncStorage.removeItem(LEGACY_SESSION_KEY);
  return legacy;
}

export async function writeStoredSession(session: StoredSession): Promise<void> {
  await Promise.all([
    writeToken(session.token),
    AsyncStorage.setItem(SESSION_USER_KEY, JSON.stringify(session.user)),
  ]);
  await AsyncStorage.removeItem(LEGACY_SESSION_KEY);
}

export async function clearStoredSession(): Promise<void> {
  await Promise.all([
    removeToken(),
    AsyncStorage.multiRemove([
      LEGACY_SESSION_KEY,
      SESSION_USER_KEY,
      WEB_SESSION_TOKEN_KEY,
    ]),
  ]);
}
