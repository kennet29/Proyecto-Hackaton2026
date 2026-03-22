import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createTipohabitoSchema = z.object({
  nombre: z.string(),
  categoria: z.string().nullable().optional(),
  descripcion: z.string().nullable().optional(),
  activo: z.boolean().optional(),
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
export class CreateTipohabitoDto extends createZodDto(createTipohabitoSchema) {}

export const updateTipohabitoSchema = z.object({
  nombre: z.string(),
  categoria: z.string().nullable().optional(),
  descripcion: z.string().nullable().optional(),
  activo: z.boolean().optional(),
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
export class UpdateTipohabitoDto extends createZodDto(updateTipohabitoSchema) {}

