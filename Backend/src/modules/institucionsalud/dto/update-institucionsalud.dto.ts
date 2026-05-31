import { createZodDto } from "nestjs-zod";
import { createInstitucionsaludSchema } from "./create-institucionsalud.dto";

/**
 * Esquema Zod para validar la actualización de institucionsalud.
 */
export const updateInstitucionsaludSchema = createInstitucionsaludSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "debes enviar al menos un campo",
  });

/**
 * DTO de entrada para actualizar institucionsalud.
 */
export class UpdateInstitucionsaludDto extends createZodDto(
  updateInstitucionsaludSchema,
) {}
