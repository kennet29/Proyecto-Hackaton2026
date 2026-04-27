import { API_URL } from '../config/api';

export type LinkedPatient = {
  pacienteId: number;
  displayName: string;
  parentesco?: string | null;
  sexo?: string | null;
};

const normalizeText = (value: unknown) => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text ? text : null;
};

export async function fetchLinkedPatients(
  headers: Record<string, string>,
): Promise<LinkedPatient[]> {
  const response = await fetch(`${API_URL}/usuario-paciente/mis-pacientes`, { headers });
  const relations = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(relations?.message ?? 'No se pudieron cargar los pacientes');
  }

  if (!Array.isArray(relations)) {
    return [];
  }

  const items = await Promise.all(
    relations.map(async (relation: any) => {
      const pacienteId = Number(relation?.pacienteId);
      let displayName =
        normalizeText(relation?.nombrePaciente) ??
        normalizeText(relation?.displayName) ??
        `Paciente #${pacienteId}`;
      let sexo =
        normalizeText(relation?.sexo) ??
        normalizeText(relation?.paciente?.sexo) ??
        normalizeText(relation?.genero) ??
        null;

      try {
        const patientResponse = await fetch(`${API_URL}/paciente/${pacienteId}`, { headers });
        const patient = await patientResponse.json().catch(() => null);

        if (patientResponse.ok && patient) {
          const fullName = `${patient?.nombres ?? ''} ${patient?.apellidos ?? ''}`.trim();
          if (fullName) {
            displayName = fullName;
          }
          sexo =
            normalizeText(patient?.sexo) ??
            normalizeText(patient?.genero) ??
            normalizeText(patient?.sexobiologico) ??
            sexo;
        }
      } catch {
        // Ignore partial lookup failures and keep the fallback relation data.
      }

      return {
        pacienteId,
        displayName: relation?.esPrincipal ? `${displayName} (Principal)` : displayName,
        parentesco: normalizeText(relation?.parentesco),
        sexo,
      } as LinkedPatient;
    }),
  );

  return items.filter((item) => Number.isFinite(item.pacienteId) && item.pacienteId > 0);
}
