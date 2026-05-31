import { createZodDto } from "nestjs-zod";
import { institucionhorarioFieldsSchema } from "./create-institucionhorario.dto";

/**
 * Esquema Zod para validar la actualización de institucionhorario.
 */
export const updateInstitucionhorarioSchema = institucionhorarioFieldsSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "debes enviar al menos un campo",
  });

/**
 * DTO de entrada para actualizar institucionhorario.
 */
export class UpdateInstitucionhorarioDto extends createZodDto(
  updateInstitucionhorarioSchema,
) {}
