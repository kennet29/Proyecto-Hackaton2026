/**
 * @file App movil/GestionSaludExpo/src/utils/jwt.ts
 * @description TypeScript module implementation.
 */

export type JwtPayload = {
  sub?: number | string;
  exp?: number;
  pacienteId?: number | string | null;
};

const decodeBase64Url = (value: string): string => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding =
    normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  const decoder = globalThis.atob;

  if (typeof decoder !== 'function') {
    throw new Error('base64 decoder unavailable');
  }

  const binary = decoder(`${normalized}${padding}`);
  return decodeURIComponent(
    Array.from(binary)
      .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
      .join(''),
  );
};

export const readJwtPayload = (accessToken: string): JwtPayload | null => {
  try {
    const [, payload] = accessToken.split('.');
    return payload ? (JSON.parse(decodeBase64Url(payload)) as JwtPayload) : null;
  } catch {
    return null;
  }
};

export const getTokenExpirationTime = (accessToken: string): number | null => {
  const expiration = readJwtPayload(accessToken)?.exp;
  return typeof expiration === 'number' ? expiration * 1000 : null;
};

export const getTokenUserId = (accessToken?: string | null): number | null => {
  if (!accessToken) {
    return null;
  }

  const subject = readJwtPayload(accessToken)?.sub;
  const parsed = Number(subject);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
};

export const getTokenPacienteId = (accessToken?: string | null): number | null => {
  if (!accessToken) {
    return null;
  }

  const pacienteId = readJwtPayload(accessToken)?.pacienteId;
  const parsed = Number(pacienteId);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
};
