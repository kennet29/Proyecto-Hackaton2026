import { createZodDto } from "nestjs-zod";
import { z } from "zod";

/**
 * Esquema Zod para validar la actualización de usuario paciente.
 */
export const updateUsuarioPacienteSchema = z
  .object({
    parentesco: z.string().max(80).optional(),
    esPrincipal: z.boolean().optional(),
    notas: z.string().max(200).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "debes enviar al menos un campo",
  });

/**
 * DTO de entrada para actualizar usuario paciente.
 */
export class UpdateUsuarioPacienteDto extends createZodDto(
  updateUsuarioPacienteSchema,
) {}
