import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createInstitucionespecialidadSchema = z.object({
  institucionSaludId: z.number().int().positive(),
  especialidadId: z.number().int().positive(),
  destacada: z.boolean().optional(),
  observaciones: z.string().trim().max(200).nullable().optional(),
  activo: z.boolean().optional(),
  creadoPor: z.string().trim().max(60).nullable().optional(),
  creadoEn: z.coerce.date().optional(),
  modificadoPor: z.string().trim().max(60).nullable().optional(),
  modificadoEn: z.coerce.date().nullable().optional(),
});

export class CreateInstitucionespecialidadDto extends createZodDto(
  createInstitucionespecialidadSchema,
) {}
