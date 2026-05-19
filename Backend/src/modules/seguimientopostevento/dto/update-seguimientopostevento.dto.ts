import { createZodDto } from "nestjs-zod";
import { createSeguimientoposteventoSchema } from "./create-seguimientopostevento.dto";

/**
 * Esquema Zod para validar la actualización de seguimientopostevento.
 */
export const updateSeguimientoposteventoSchema =
  createSeguimientoposteventoSchema
    .partial()
    .refine((value) => Object.keys(value).length > 0, {
      message: "debes enviar al menos un campo",
    });

/**
 * DTO de entrada para actualizar seguimientopostevento.
 */
export class UpdateSeguimientoposteventoDto extends createZodDto(
  updateSeguimientoposteventoSchema,
) {}
