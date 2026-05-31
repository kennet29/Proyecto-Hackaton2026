import { createZodDto } from "nestjs-zod";
import { z } from "zod";

/**
 * Esquema Zod utilizado por claim permiso acceso qr.
 */
export const claimPermisoAccesoQrSchema = z.object({
  token: z.string().min(10).max(128),
});

/**
 * DTO usado por el flujo claim permiso acceso qr.
 */
export class ClaimPermisoAccesoQrDto extends createZodDto(
  claimPermisoAccesoQrSchema,
) {}
