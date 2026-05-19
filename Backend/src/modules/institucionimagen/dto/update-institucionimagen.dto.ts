import { createZodDto } from "nestjs-zod";
import { createInstitucionimagenSchema } from "./create-institucionimagen.dto";

/**
 * Esquema Zod para validar la actualización de institucionimagen.
 */
export const updateInstitucionimagenSchema = createInstitucionimagenSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "debes enviar al menos un campo",
  });

/**
 * DTO de entrada para actualizar institucionimagen.
 */
export class UpdateInstitucionimagenDto extends createZodDto(
  updateInstitucionimagenSchema,
) {}
