import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createObjetivocronicoSchema = z.object({
  condicioncronicaId: z.number().int(),
  descripcion: z.string(),
  indicador: z.string().nullable().optional(),
  valormeta: z.number().nullable().optional(),
  unidad: z.string().nullable().optional(),
  fechalimite: z.coerce.date().nullable().optional(),
  estado: z.string().optional(),
  cumplido: z.boolean().optional(),
  observaciones: z.string().nullable().optional(),
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
export class CreateObjetivocronicoDto extends createZodDto(createObjetivocronicoSchema) {}

export const updateObjetivocronicoSchema = z.object({
  condicioncronicaId: z.number().int(),
  descripcion: z.string(),
  indicador: z.string().nullable().optional(),
  valormeta: z.number().nullable().optional(),
  unidad: z.string().nullable().optional(),
  fechalimite: z.coerce.date().nullable().optional(),
  estado: z.string().optional(),
  cumplido: z.boolean().optional(),
  observaciones: z.string().nullable().optional(),
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
export class UpdateObjetivocronicoDto extends createZodDto(updateObjetivocronicoSchema) {}

