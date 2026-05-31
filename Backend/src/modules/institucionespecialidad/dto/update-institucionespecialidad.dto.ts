import { createZodDto } from "nestjs-zod";
import { createInstitucionespecialidadSchema } from "./create-institucionespecialidad.dto";

/**
 * Esquema Zod para validar la actualización de institucionespecialidad.
 */
export const updateInstitucionespecialidadSchema =
  createInstitucionespecialidadSchema
    .partial()
    .refine((value) => Object.keys(value).length > 0, {
      message: "debes enviar al menos un campo",
    });

/**
 * DTO de entrada para actualizar institucionespecialidad.
 */
export class UpdateInstitucionespecialidadDto extends createZodDto(
  updateInstitucionespecialidadSchema,
) {}
