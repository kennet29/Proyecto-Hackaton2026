import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { temporalDurations } from "./create-permisoacceso.dto";

/**
 * Esquema Zod para validar la actualización de permiso acceso.
 */
export const updatePermisoAccesoSchema = z.object({
  tipo: z.enum(["temporal", "permanente"]).optional(),
  duracion: z.enum(temporalDurations).nullable().optional(),
  notas: z.string().max(200).nullable().optional(),
  estado: z.enum(["activo", "revocado"]).optional(),
});

/**
 * DTO de entrada para actualizar permiso acceso.
 */
export class UpdatePermisoAccesoDto extends createZodDto(
  updatePermisoAccesoSchema,
) {}
