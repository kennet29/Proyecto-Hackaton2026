import AsyncStorage from '@react-native-async-storage/async-storage';

const keyForPatient = (pacienteId: number) => `@gs_clinical_summary_${pacienteId}`;

export async function readClinicalSummaryCache<T>(pacienteId: number): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(keyForPatient(pacienteId));
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn('[cache] no se pudo leer el resumen clinico', error);
    return null;
  }
}

export async function writeClinicalSummaryCache<T>(
  pacienteId: number,
  payload: T,
): Promise<void> {
  try {
    await AsyncStorage.setItem(keyForPatient(pacienteId), JSON.stringify(payload));
  } catch (error) {
    console.warn('[cache] no se pudo guardar el resumen clinico', error);
  }
}
