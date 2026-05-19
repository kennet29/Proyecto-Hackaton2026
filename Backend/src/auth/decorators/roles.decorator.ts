import { SetMetadata } from "@nestjs/common";

/**
 * Clave de metadata usada por el decorador `ROLES_KEY`.
 */
export const ROLES_KEY = "roles";

/**
 * Decorador que asocia los roles permitidos a un endpoint o controlador.
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
