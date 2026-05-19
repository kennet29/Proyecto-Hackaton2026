import { createZodDto } from "nestjs-zod";
import { createMedicamentoraroSchema } from "./create-medicamentoraro.dto";

/**
 * Esquema Zod para validar la actualización de medicamentoraro.
 */
export const updateMedicamentoraroSchema = createMedicamentoraroSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "debes enviar al menos un campo",
  });

/**
 * DTO de entrada para actualizar medicamentoraro.
 */
export class UpdateMedicamentoraroDto extends createZodDto(
  updateMedicamentoraroSchema,
) {}
