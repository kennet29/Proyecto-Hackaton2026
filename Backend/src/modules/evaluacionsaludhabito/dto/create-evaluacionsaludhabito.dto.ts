import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createEvaluacionsaludhabitoSchema = z.object({
  pacienteId: z.number().int(),
  fecha: z.coerce.date().optional(),
  puntaje: z.number(),
  categoria: z.string().nullable().optional(),
  resumen: z.string().nullable().optional(),
  detalle: z.string().nullable().optional(),
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
export class CreateEvaluacionsaludhabitoDto extends createZodDto(createEvaluacionsaludhabitoSchema) {}

export const updateEvaluacionsaludhabitoSchema = z.object({
  pacienteId: z.number().int(),
  fecha: z.coerce.date().optional(),
  puntaje: z.number(),
  categoria: z.string().nullable().optional(),
  resumen: z.string().nullable().optional(),
  detalle: z.string().nullable().optional(),
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
export class UpdateEvaluacionsaludhabitoDto extends createZodDto(updateEvaluacionsaludhabitoSchema) {}

