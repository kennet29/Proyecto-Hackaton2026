/**
 * @file App movil/GestionSaludExpo/src/utils/fingerprint.ts
 * @description TypeScript module implementation.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_PREFIX = '@fingerprint_template_';

const buildKeyVariants = (username: string): string[] => {
  const trimmed = username.trim();
  const normalized = trimmed.toLowerCase();
  const keys = new Set<string>();
  if (normalized) {
    keys.add(`${KEY_PREFIX}${normalized}`);
  }
  if (trimmed && trimmed !== normalized) {
    keys.add(`${KEY_PREFIX}${trimmed}`);
  }
  return Array.from(keys);
};

export const saveFingerprintTemplate = async (
  username: string,
  template: string,
): Promise<void> => {
  if (!username.trim()) {
    return;
  }
  const keys = buildKeyVariants(username);
  if (!keys.length) {
    return;
  }
  const entries = keys.map<[string, string]>((key) => [key, template]);
  await AsyncStorage.multiSet(entries);
};

export const loadFingerprintTemplate = async (
  username: string,
): Promise<string | null> => {
  if (!username.trim()) {
    return null;
  }
  const keys = buildKeyVariants(username);
  if (!keys.length) {
    return null;
  }
  for (const key of keys) {
    const value = await AsyncStorage.getItem(key);
    if (value) {
      const primaryKey = keys[0];
      if (key !== primaryKey) {
        await AsyncStorage.setItem(primaryKey, value);
      }
      return value;
    }
  }
  return null;
};

export const generateFingerprintTemplate = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  for (let i = 0; i < 96; i += 1) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
};
