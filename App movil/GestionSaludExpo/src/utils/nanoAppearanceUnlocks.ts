/**
 * @file App movil/GestionSaludExpo/src/utils/nanoAppearanceUnlocks.ts
 * @description TypeScript module implementation.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';

export type NanoAppearanceUnlockRule = {
  month: number;
  day: number;
  dateLabel: string;
};

export const NANO_APPEARANCE_UNLOCK_RULES: Record<string, NanoAppearanceUnlockRule> = {
  valentin: { month: 2, day: 14, dateLabel: '14 de febrero' },
  gladiador: { month: 9, day: 14, dateLabel: '14 de septiembre' },
  patriota: { month: 9, day: 15, dateLabel: '15 de septiembre' },
  halloween: { month: 10, day: 31, dateLabel: '31 de octubre' },
  navideno: { month: 12, day: 25, dateLabel: '25 de diciembre' },
};

const unlockStorageKey = (userId: number) => `nano-appearance-unlocks-v1-${userId}`;
const validAppearanceIds = new Set([
  'base',
  ...Object.keys(NANO_APPEARANCE_UNLOCK_RULES),
]);

export type NanoAppearanceState = {
  selectedId: string;
  unlockedIds: Set<string>;
};

export const getNanoAppearanceUnlockRule = (appearanceId: string) =>
  NANO_APPEARANCE_UNLOCK_RULES[appearanceId];

export async function loadUnlockedNanoAppearanceIds(userId?: number | null) {
  const unlockedIds = new Set<string>(['base']);
  if (!userId) {
    return unlockedIds;
  }

  const savedIds = await AsyncStorage.getItem(unlockStorageKey(userId));
  if (!savedIds) {
    return unlockedIds;
  }

  try {
    const parsedIds = JSON.parse(savedIds);
    if (Array.isArray(parsedIds)) {
      parsedIds.forEach((id) => {
        if (typeof id === 'string') unlockedIds.add(id);
      });
    }
  } catch {
    // Si el valor local está dañado, Nano Base continúa disponible.
  }
  return unlockedIds;
}

export async function cacheUnlockedNanoAppearanceIds(
  userId: number,
  appearanceIds: Iterable<string>,
) {
  const unlockedIds = new Set(
    ['base', ...appearanceIds].filter((id) => validAppearanceIds.has(id)),
  );
  await AsyncStorage.setItem(unlockStorageKey(userId), JSON.stringify([...unlockedIds]));
  return unlockedIds;
}

const parseServerState = (value: unknown): NanoAppearanceState => {
  const payload = value as { selectedId?: unknown; unlockedIds?: unknown };
  if (!Array.isArray(payload?.unlockedIds)) {
    throw new Error('El servidor devolvió una configuración de Nano inválida.');
  }
  const unlockedIds = new Set<string>(
    ['base', ...payload.unlockedIds]
      .filter((id): id is string => typeof id === 'string')
      .filter((id) => validAppearanceIds.has(id)),
  );
  const selectedId =
    typeof payload.selectedId === 'string' &&
    unlockedIds.has(payload.selectedId) &&
    validAppearanceIds.has(payload.selectedId)
      ? payload.selectedId
      : 'base';
  return { selectedId, unlockedIds };
};

export async function fetchNanoAppearanceState(token: string) {
  const response = await fetch(`${API_URL}/nano/appearance`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.message ?? 'No se pudo cargar la configuración de Nano.');
  }
  return parseServerState(body);
}

export async function selectNanoAppearanceOnServer(
  token: string,
  appearanceId: string,
) {
  const response = await fetch(`${API_URL}/nano/appearance`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ appearanceId }),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.message ?? 'No se pudo guardar la apariencia de Nano.');
  }
  return parseServerState(body);
}
