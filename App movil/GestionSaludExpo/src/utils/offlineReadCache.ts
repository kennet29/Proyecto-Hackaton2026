import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';
import { getTokenUserId } from './jwt';

type CachedPayload<T> = {
  savedAt: string;
  data: T;
};

export type OfflineReadResult<T> = {
  data: T;
  source: 'network' | 'cache';
  savedAt: string;
};

const cacheKeyFor = (path: string, headers: Record<string, string>) => {
  const token = headers.Authorization?.replace(/^Bearer\s+/i, '');
  const userId = getTokenUserId(token);
  if (!userId) {
    throw new Error('No se pudo identificar la cuenta para guardar los registros.');
  }

  return `@gs_offline_read_${userId}_${encodeURIComponent(path)}`;
};

const readCache = async <T>(key: string): Promise<CachedPayload<T> | null> => {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CachedPayload<T>>;
    if (!parsed.savedAt || !('data' in parsed)) return null;
    return parsed as CachedPayload<T>;
  } catch (error) {
    console.warn('[offline-read] no se pudo leer la copia local', error);
    return null;
  }
};

const writeCache = async <T>(key: string, payload: CachedPayload<T>) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(payload));
  } catch (error) {
    // Un fallo de almacenamiento no debe impedir mostrar los datos del servidor.
    console.warn('[offline-read] no se pudo guardar la copia local', error);
  }
};

/**
 * Obtiene JSON del servidor y conserva la última respuesta correcta por cuenta.
 * Ante un fallo de red o del servidor, devuelve esa copia para permitir lectura offline.
 */
export async function getJsonWithOfflineFallback<T>(
  path: string,
  headers: Record<string, string>,
): Promise<OfflineReadResult<T>> {
  const key = cacheKeyFor(path, headers);

  try {
    const response = await fetch(`${API_URL}${path}`, { headers });
    const body = await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        body && typeof body === 'object' && 'message' in body
          ? String((body as { message?: unknown }).message)
          : 'No se pudieron cargar los registros';
      const error = new Error(message);

      // No se debe ocultar un problema de autorización mostrando datos antiguos.
      if (response.status === 401 || response.status === 403) {
        throw Object.assign(error, { skipOfflineFallback: true });
      }
      throw error;
    }

    const savedAt = new Date().toISOString();
    await writeCache(key, { savedAt, data: body as T });
    return { data: body as T, source: 'network', savedAt };
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'skipOfflineFallback' in error
    ) {
      throw error;
    }

    const cached = await readCache<T>(key);
    if (cached) {
      return {
        data: cached.data,
        source: 'cache',
        savedAt: cached.savedAt,
      };
    }
    throw error;
  }
}
