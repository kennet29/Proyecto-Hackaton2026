import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createControlcronicoSchema = z.object({
  condicioncronicaId: z.number().int(),
  fechacontrol: z.coerce.date(),
  indicador: z.string().nullable().optional(),
  valor: z.number().nullable().optional(),
  unidad: z.string().nullable().optional(),
  resultado: z.string().nullable().optional(),
  conclusiones: z.string().nullable().optional(),
  proximocontrol: z.coerce.date().nullable().optional(),
  medico: z.string().nullable().optional(),
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
export class CreateControlcronicoDto extends createZodDto(createControlcronicoSchema) {}

export const updateControlcronicoSchema = z.object({
  condicioncronicaId: z.number().int(),
  fechacontrol: z.coerce.date(),
  indicador: z.string().nullable().optional(),
  valor: z.number().nullable().optional(),
  unidad: z.string().nullable().optional(),
  resultado: z.string().nullable().optional(),
  conclusiones: z.string().nullable().optional(),
  proximocontrol: z.coerce.date().nullable().optional(),
  medico: z.string().nullable().optional(),
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
export class UpdateControlcronicoDto extends createZodDto(updateControlcronicoSchema) {}

