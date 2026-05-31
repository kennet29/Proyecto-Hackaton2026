import { createZodDto } from "nestjs-zod";
import { z } from "zod";

/**
 * Esquema Zod para validar la creación de usuario paciente.
 */
export const createUsuarioPacienteSchema = z.object({
  usuarioId: z.number().int().positive().optional(),
  pacienteId: z.number().int().positive(),
  parentesco: z.string().max(80).optional(),
  esPrincipal: z.boolean().optional(),
  notas: z.string().max(200).optional(),
});

/**
 * DTO de entrada para crear usuario paciente.
 */
export class CreateUsuarioPacienteDto extends createZodDto(
  createUsuarioPacienteSchema,
) {}
