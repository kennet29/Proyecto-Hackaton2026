import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createNotificacionSchema = z.object({
  pacienteId: z.number().int(),
  tipo: z.string(),
  mensaje: z.string(),
  fechaprogramada: z.coerce.date(),
  enviada: z.boolean().optional(),
  medio: z.string().nullable().optional(),
  entidadorigen: z.string().nullable().optional(),
  entidadId: z.number().int().nullable().optional(),
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
export class CreateNotificacionDto extends createZodDto(createNotificacionSchema) {}

export const updateNotificacionSchema = z.object({
  pacienteId: z.number().int(),
  tipo: z.string(),
  mensaje: z.string(),
  fechaprogramada: z.coerce.date(),
  enviada: z.boolean().optional(),
  medio: z.string().nullable().optional(),
  entidadorigen: z.string().nullable().optional(),
  entidadId: z.number().int().nullable().optional(),
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
export class UpdateNotificacionDto extends createZodDto(updateNotificacionSchema) {}

