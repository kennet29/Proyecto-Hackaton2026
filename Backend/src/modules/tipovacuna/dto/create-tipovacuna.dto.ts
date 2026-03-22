import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createTipovacunaSchema = z.object({
  nombre: z.string(),
  dosisrequeridas: z.number().int().nullable().optional(),
  intervalodias: z.number().int().nullable().optional(),
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
export class CreateTipovacunaDto extends createZodDto(createTipovacunaSchema) {}

export const updateTipovacunaSchema = z.object({
  nombre: z.string(),
  dosisrequeridas: z.number().int().nullable().optional(),
  intervalodias: z.number().int().nullable().optional(),
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
export class UpdateTipovacunaDto extends createZodDto(updateTipovacunaSchema) {}

