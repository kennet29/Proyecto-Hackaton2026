import type { AuthenticatedUser } from "../auth.service";

/**
 * Normaliza el nombre de un rol para comparaciones consistentes.
 */
export const normalizeRole = (role?: string | null): string =>
  (role ?? "").trim().toLowerCase();

/**
 * Comprueba si el usuario autenticado posee alguno de los roles permitidos.
 * @param user Usuario autenticado asociado a la solicitud.
 * @param allowedRoles Colección de roles aceptados para la operación.
 * @returns Valor booleano que resume el resultado de la evaluación.
 */
export const hasAnyRole = (
  user: Pick<AuthenticatedUser, "role"> | null | undefined,
  allowedRoles: string[],
): boolean => {
  if (!allowedRoles.length) {
    return true;
  }
  const normalized = normalizeRole(user?.role);
  return allowedRoles.some((role) => normalizeRole(role) === normalized);
};
