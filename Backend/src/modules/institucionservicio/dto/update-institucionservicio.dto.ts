import { createZodDto } from "nestjs-zod";
import { createInstitucionservicioSchema } from "./create-institucionservicio.dto";

/**
 * Esquema Zod para validar la actualización de institucionservicio.
 */
export const updateInstitucionservicioSchema = createInstitucionservicioSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "debes enviar al menos un campo",
  });

/**
 * DTO de entrada para actualizar institucionservicio.
 */
export class UpdateInstitucionservicioDto extends createZodDto(
  updateInstitucionservicioSchema,
) {}
