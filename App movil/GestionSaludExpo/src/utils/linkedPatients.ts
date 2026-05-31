import { API_URL } from '../config/api';

export type LinkedPatient = {
  pacienteId: number;
  displayName: string;
  parentesco?: string | null;
  sexo?: string | null;
  contacto?: string | null;
};

const LINKED_PATIENTS_CACHE_TTL_MS = 15000;
const linkedPatientsCache = new Map<
  string,
  { expiresAt: number; items: LinkedPatient[] }
>();
const inFlightLinkedPatientsRequests = new Map<string, Promise<LinkedPatient[]>>();

const normalizeText = (value: unknown) => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text ? text : null;
};

const buildCacheKey = (headers: Record<string, string>) => headers.Authorization ?? '__anon__';

const cloneItems = (items: LinkedPatient[]) => items.map((item) => ({ ...item }));

export const invalidateLinkedPatientsCache = (headers?: Record<string, string>) => {
  if (!headers) {
    linkedPatientsCache.clear();
    inFlightLinkedPatientsRequests.clear();
    return;
  }

  const cacheKey = buildCacheKey(headers);
  linkedPatientsCache.delete(cacheKey);
  inFlightLinkedPatientsRequests.delete(cacheKey);
};

export async function fetchLinkedPatients(
  headers: Record<string, string>,
  options?: { forceRefresh?: boolean },
): Promise<LinkedPatient[]> {
  const cacheKey = buildCacheKey(headers);
  const forceRefresh = options?.forceRefresh ?? false;

  if (!forceRefresh) {
    const cached = linkedPatientsCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cloneItems(cached.items);
    }

    const inFlightRequest = inFlightLinkedPatientsRequests.get(cacheKey);
    if (inFlightRequest) {
      return cloneItems(await inFlightRequest);
    }
  }

  const request = (async () => {
    const response = await fetch(`${API_URL}/usuario-paciente/mis-pacientes`, { headers });
    const relations = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(relations?.message ?? 'No se pudieron cargar los pacientes');
    }

    if (!Array.isArray(relations)) {
      linkedPatientsCache.set(cacheKey, {
        expiresAt: Date.now() + LINKED_PATIENTS_CACHE_TTL_MS,
        items: [],
      });
      return [];
    }

    const items = await Promise.all(
      relations.map(async (relation: any) => {
        const pacienteId = Number(
          relation?.pacienteId ?? relation?.pacienteid ?? relation?.id ?? relation?.paciente?.pacienteId,
        );
        if (!Number.isFinite(pacienteId) || pacienteId <= 0) {
          return null;
        }
        let displayName =
          normalizeText(relation?.nombrePaciente) ??
          normalizeText(relation?.displayName) ??
          `Paciente #${pacienteId}`;
        let sexo =
          normalizeText(relation?.sexo) ??
          normalizeText(relation?.paciente?.sexo) ??
          normalizeText(relation?.genero) ??
          null;
        let contacto =
          normalizeText(relation?.telefono) ??
          normalizeText(relation?.email) ??
          normalizeText(relation?.paciente?.telefono) ??
          normalizeText(relation?.paciente?.email) ??
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
            contacto =
              normalizeText(patient?.telefono) ??
              normalizeText(patient?.email) ??
              contacto;
          }
        } catch {
          // Ignore partial lookup failures and keep the fallback relation data.
        }

        return {
          pacienteId,
          displayName: relation?.esPrincipal ? `${displayName} (Principal)` : displayName,
          parentesco: normalizeText(relation?.parentesco),
          sexo,
          contacto,
        } as LinkedPatient;
      }),
    );

    const filteredItems = items.filter((item): item is LinkedPatient => Boolean(item));

    linkedPatientsCache.set(cacheKey, {
      expiresAt: Date.now() + LINKED_PATIENTS_CACHE_TTL_MS,
      items: cloneItems(filteredItems),
    });

    return filteredItems;
  })();

  inFlightLinkedPatientsRequests.set(cacheKey, request);

  try {
    return cloneItems(await request);
  } finally {
    inFlightLinkedPatientsRequests.delete(cacheKey);
  }
}
