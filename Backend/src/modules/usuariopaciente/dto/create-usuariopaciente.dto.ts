import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createUsuarioPacienteSchema = z.object({
  usuarioId: z.number().int().positive().optional(),
  pacienteId: z.number().int().positive(),
  parentesco: z.string().max(80).optional(),
  esPrincipal: z.boolean().optional(),
  notas: z.string().max(200).optional(),
});

export class CreateUsuarioPacienteDto extends createZodDto(createUsuarioPacienteSchema) {}
