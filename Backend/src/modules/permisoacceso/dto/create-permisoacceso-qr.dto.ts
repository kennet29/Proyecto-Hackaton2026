import { createZodDto } from "nestjs-zod";
import { z } from "zod";

/**
 * Esquema Zod para validar la creación de permiso acceso qr.
 */
export const createPermisoAccesoQrSchema = z.object({
  duracionMinutos: z.number().int().min(1).max(60).default(5),
});

/**
 * DTO de entrada para crear permiso acceso qr.
 */
export class CreatePermisoAccesoQrDto extends createZodDto(
  createPermisoAccesoQrSchema,
) {}
