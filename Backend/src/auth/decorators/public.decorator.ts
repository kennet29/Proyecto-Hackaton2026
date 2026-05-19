import { SetMetadata } from "@nestjs/common";

/**
 * Clave de metadata usada por el decorador `IS_PUBLIC_KEY`.
 */
export const IS_PUBLIC_KEY = "isPublic";
/**
 * Decorador que marca un endpoint como público y omite autenticación obligatoria.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
