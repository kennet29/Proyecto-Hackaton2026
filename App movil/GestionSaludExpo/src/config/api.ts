/**
 * @file App movil/GestionSaludExpo/src/config/api.ts
 * @description TypeScript module implementation.
 */

import Constants from 'expo-constants';
import { NativeModules, Platform } from 'react-native';

const API_SUFFIX = '/api/v1';
const DEFAULT_API_BASE = 'https://proyecto-hackaton2026.onrender.com';

const normalizeBaseUrl = (value: string): string => value.replace(/\/+$/, '');
const ensureApiUrl = (value: string): string => {
  const normalized = normalizeBaseUrl(value);
  return normalized.endsWith(API_SUFFIX) ? normalized : `${normalized}${API_SUFFIX}`;
};

const envBase = process.env.EXPO_PUBLIC_API_URL
  ? ensureApiUrl(process.env.EXPO_PUBLIC_API_URL)
  : null;

const configuredBase = typeof Constants.expoConfig?.extra?.apiUrl === 'string'
  ? ensureApiUrl(Constants.expoConfig.extra.apiUrl)
  : null;

type HostCandidate = string | undefined | null;

const sanitizeHost = (value?: string): string | null => {
  if (!value) {
    return null;
  }
  const withoutScheme = value.replace(/^\w+:\/\//, '');
  const clean = withoutScheme.split(/[/:?]/)[0];
  return clean || null;
};

const isLikelyUnreachable = (host: string): boolean => {
  const normalized = host.toLowerCase();
  if (normalized === 'localhost' || normalized === '127.0.0.1') {
    return Platform.OS !== 'web';
  }
  return normalized.endsWith('.expo.dev') || normalized.endsWith('exp.host');
};

const deriveHostFromScriptUrl = (): string | null => {
  const scriptURL: HostCandidate = NativeModules?.SourceCode?.scriptURL;
  if (!scriptURL) {
    return null;
  }
  try {
    const url = new URL(scriptURL);
    return url.hostname || null;
  } catch {
    return sanitizeHost(scriptURL);
  }
};

const deriveHostFromExpo = (): string | null => {
  const possibleSources: HostCandidate[] = [
    Constants.expoConfig?.hostUri,
    Constants.expoGoConfig?.hostUri,
    (Constants as any).manifest?.debuggerHost,
    (Constants as any).manifest?.hostUri,
    (Constants as any).manifest2?.extra?.expoClient?.hostUri,
  ];

  for (const source of possibleSources) {
    const host = sanitizeHost(source ?? undefined);
    if (host) {
      return host;
    }
  }

  return null;
};

const buildFallbackUrl = (): string => {
  const host = deriveHostFromScriptUrl() ?? deriveHostFromExpo() ?? 'localhost';
  if (__DEV__ && isLikelyUnreachable(host)) {
    console.warn(
      `[api] usando host ${host}. Configura EXPO_PUBLIC_API_URL con la IP de tu backend si las peticiones no llegan.`,
    );
  }
  return `http://${host}:3000${API_SUFFIX}`;
};

export const API_URL =
  envBase ?? configuredBase ?? (__DEV__ ? buildFallbackUrl() : ensureApiUrl(DEFAULT_API_BASE));

if (__DEV__) {
  console.log(`[api] base URL: ${API_URL}`);
}

