import { createZodDto } from "nestjs-zod";
import { createSeguimientofisicoSchema } from "./create-seguimientofisico.dto";

/**
 * Esquema Zod para validar la actualización de seguimientofisico.
 */
export const updateSeguimientofisicoSchema = createSeguimientofisicoSchema
  .omit({ pacienteId: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "debes enviar al menos un campo",
  });

/**
 * DTO de entrada para actualizar seguimientofisico.
 */
export class UpdateSeguimientofisicoDto extends createZodDto(
  updateSeguimientofisicoSchema,
) {}
