/**
 * @file App movil/GestionSaludExpo/src/utils/nanoHistory.ts
 * @description TypeScript module implementation.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const NANO_HISTORY_KEY = 'nano-history-v1';
const NANO_HISTORY_LIMIT = 20;

export type NanoHistoryMacronutrients = {
  calories: number;
  carbohydratesGrams: number;
  proteinGrams: number;
  fatGrams: number;
  fiberGrams: number;
  sugarGrams: number;
};

export type NanoHistoryMicronutrient = {
  key: string;
  label: string;
  amount: string;
  dailyValuePercent: number;
};

export type NanoHistoryEntry = {
  id: string;
  createdAt: string;
  goalLabel: string;
  photoUri: string;
  feedback: string;
  userNote?: string | null;
  macronutrients: NanoHistoryMacronutrients | null;
  micronutrients: NanoHistoryMicronutrient[] | null;
};

export async function getNanoHistory() {
  try {
    const raw = await AsyncStorage.getItem(NANO_HISTORY_KEY);
    if (!raw) {
      return [] as NanoHistoryEntry[];
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [] as NanoHistoryEntry[];
    }

    return parsed as NanoHistoryEntry[];
  } catch {
    return [] as NanoHistoryEntry[];
  }
}

export async function saveNanoHistoryEntry(entry: NanoHistoryEntry) {
  const history = await getNanoHistory();
  const nextHistory = [entry, ...history].slice(0, NANO_HISTORY_LIMIT);
  await AsyncStorage.setItem(NANO_HISTORY_KEY, JSON.stringify(nextHistory));
}
