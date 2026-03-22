import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createAntecedentefamiliarSchema = z.object({
  pacienteId: z.number().int(),
  parentesco: z.string(),
  condicion: z.string(),
  estado: z.string().nullable().optional(),
  edaddiagnostico: z.number().int().nullable().optional(),
  observaciones: z.string().nullable().optional(),
  fecharegistro: z.coerce.date().optional(),
  confirmado: z.boolean().optional(),
  fuente: z.string().nullable().optional(),
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
export class CreateAntecedentefamiliarDto extends createZodDto(createAntecedentefamiliarSchema) {}

export const updateAntecedentefamiliarSchema = z.object({
  pacienteId: z.number().int(),
  parentesco: z.string(),
  condicion: z.string(),
  estado: z.string().nullable().optional(),
  edaddiagnostico: z.number().int().nullable().optional(),
  observaciones: z.string().nullable().optional(),
  fecharegistro: z.coerce.date().optional(),
  confirmado: z.boolean().optional(),
  fuente: z.string().nullable().optional(),
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
export class UpdateAntecedentefamiliarDto extends createZodDto(updateAntecedentefamiliarSchema) {}

