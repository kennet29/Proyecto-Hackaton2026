import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createEstilovidaSchema = z.object({
  pacienteId: z.number().int(),
  fecharegistro: z.coerce.date().optional(),
  alimentacion: z.string().nullable().optional(),
  actividadfisica: z.string().nullable().optional(),
  consumoalcohol: z.string().nullable().optional(),
  consumotabaco: z.string().nullable().optional(),
  horassueno: z.number().nullable().optional(),
  estres: z.string().nullable().optional(),
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
export class CreateEstilovidaDto extends createZodDto(createEstilovidaSchema) {}

export const updateEstilovidaSchema = z.object({
  pacienteId: z.number().int(),
  fecharegistro: z.coerce.date().optional(),
  alimentacion: z.string().nullable().optional(),
  actividadfisica: z.string().nullable().optional(),
  consumoalcohol: z.string().nullable().optional(),
  consumotabaco: z.string().nullable().optional(),
  horassueno: z.number().nullable().optional(),
  estres: z.string().nullable().optional(),
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
export class UpdateEstilovidaDto extends createZodDto(updateEstilovidaSchema) {}

