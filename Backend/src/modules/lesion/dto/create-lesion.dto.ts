import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createLesionSchema = z.object({
  pacienteId: z.number().int(),
  tipolesionId: z.number().int().nullable().optional(),
  fechalesion: z.coerce.date(),
  tipo: z.string(),
  partecuerpo: z.string().nullable().optional(),
  severidad: z.string().nullable().optional(),
  tratamiento: z.string().nullable().optional(),
  recuperado: z.boolean().optional(),
  notas: z.string().nullable().optional(),
  creadopor: z.string().nullable().optional(),
  creadoen: z.coerce.date().optional(),
  modificadopor: z.string().nullable().optional(),
  modificadoen: z.coerce.date().nullable().optional(),
  campoprueba01: z.string().nullable().optional(),
  campoprueba02: z.string().nullable().optional(),
  campoprueba03: z.string().nullable().optional(),
  campoprueba04: z.string().nullable().optional(),
  campoprueba05: z.string().nullable().optional(),
});
export class CreateLesionDto extends createZodDto(createLesionSchema) {}

export const updateLesionSchema = z.object({
  pacienteId: z.number().int(),
  tipolesionId: z.number().int().nullable().optional(),
  fechalesion: z.coerce.date(),
  tipo: z.string(),
  partecuerpo: z.string().nullable().optional(),
  severidad: z.string().nullable().optional(),
  tratamiento: z.string().nullable().optional(),
  recuperado: z.boolean().optional(),
  notas: z.string().nullable().optional(),
  creadopor: z.string().nullable().optional(),
  creadoen: z.coerce.date().optional(),
  modificadopor: z.string().nullable().optional(),
  modificadoen: z.coerce.date().nullable().optional(),
  campoprueba01: z.string().nullable().optional(),
  campoprueba02: z.string().nullable().optional(),
  campoprueba03: z.string().nullable().optional(),
  campoprueba04: z.string().nullable().optional(),
  campoprueba05: z.string().nullable().optional(),
}).partial().refine((value) => Object.keys(value).length > 0, { message: 'debes enviar al menos un campo' });
export class UpdateLesionDto extends createZodDto(updateLesionSchema) {}

