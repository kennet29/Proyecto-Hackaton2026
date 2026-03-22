import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createAdherenciacronicaSchema = z.object({
  condicioncronicaId: z.number().int(),
  medicacionId: z.number().int().nullable().optional(),
  fechaevento: z.coerce.date().optional(),
  tipo: z.string().optional(),
  porcentaje: z.number().nullable().optional(),
  estado: z.string().nullable().optional(),
  descripcion: z.string().nullable().optional(),
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
export class CreateAdherenciacronicaDto extends createZodDto(createAdherenciacronicaSchema) {}

export const updateAdherenciacronicaSchema = z.object({
  condicioncronicaId: z.number().int(),
  medicacionId: z.number().int().nullable().optional(),
  fechaevento: z.coerce.date().optional(),
  tipo: z.string().optional(),
  porcentaje: z.number().nullable().optional(),
  estado: z.string().nullable().optional(),
  descripcion: z.string().nullable().optional(),
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
export class UpdateAdherenciacronicaDto extends createZodDto(updateAdherenciacronicaSchema) {}

