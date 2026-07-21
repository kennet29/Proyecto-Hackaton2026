import AsyncStorage from '@react-native-async-storage/async-storage';

const keyForPatient = (ownerUserId: number, pacienteId: number) =>
  `@gs_clinical_summary_${ownerUserId}_${pacienteId}`;

export async function readClinicalSummaryCache<T>(
  ownerUserId: number,
  pacienteId: number,
): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(keyForPatient(ownerUserId, pacienteId));
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
  ownerUserId: number,
  pacienteId: number,
  payload: T,
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      keyForPatient(ownerUserId, pacienteId),
      JSON.stringify(payload),
    );
    // El formato anterior no aislaba la informacion entre cuentas.
    await AsyncStorage.removeItem(`@gs_clinical_summary_${pacienteId}`);
  } catch (error) {
    console.warn('[cache] no se pudo guardar el resumen clinico', error);
  }
}
