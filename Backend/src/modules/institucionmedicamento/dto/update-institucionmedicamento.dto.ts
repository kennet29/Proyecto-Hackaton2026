import { createZodDto } from "nestjs-zod";
import { createInstitucionmedicamentoSchema } from "./create-institucionmedicamento.dto";

/**
 * Esquema Zod para validar la actualización de institucionmedicamento.
 */
export const updateInstitucionmedicamentoSchema =
  createInstitucionmedicamentoSchema
    .partial()
    .refine((value) => Object.keys(value).length > 0, {
      message: "debes enviar al menos un campo",
    });

/**
 * DTO de entrada para actualizar institucionmedicamento.
 */
export class UpdateInstitucionmedicamentoDto extends createZodDto(
  updateInstitucionmedicamentoSchema,
) {}
