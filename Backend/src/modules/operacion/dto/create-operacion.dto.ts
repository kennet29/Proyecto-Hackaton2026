import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createOperacionSchema = z.object({
  pacienteId: z.number().int(),
  tipooperacionId: z.number().int().nullable().optional(),
  fechaoperacion: z.coerce.date(),
  tipo: z.string(),
  hospital: z.string().nullable().optional(),
  cirujano: z.string().nullable().optional(),
  resultado: z.string().nullable().optional(),
  complicaciones: z.string().nullable().optional(),
  estado: z.string().optional(),
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
export class CreateOperacionDto extends createZodDto(createOperacionSchema) {}

export const updateOperacionSchema = z.object({
  pacienteId: z.number().int(),
  tipooperacionId: z.number().int().nullable().optional(),
  fechaoperacion: z.coerce.date(),
  tipo: z.string(),
  hospital: z.string().nullable().optional(),
  cirujano: z.string().nullable().optional(),
  resultado: z.string().nullable().optional(),
  complicaciones: z.string().nullable().optional(),
  estado: z.string().optional(),
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
export class UpdateOperacionDto extends createZodDto(updateOperacionSchema) {}

