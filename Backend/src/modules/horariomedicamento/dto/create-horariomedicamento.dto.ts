import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createHorariomedicamentoSchema = z.object({
  medicacionId: z.number().int(),
  horaprogramada: z.coerce.date(),
  frecuencia: z.string().nullable().optional(),
  diasemana: z.number().int().nullable().optional(),
  generarecordatorio: z.boolean().optional(),
  proximaalarma: z.coerce.date().nullable().optional(),
  estadorecordatorio: z.string().optional(),
  ultimoenvio: z.coerce.date().nullable().optional(),
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
export class CreateHorariomedicamentoDto extends createZodDto(createHorariomedicamentoSchema) {}

export const updateHorariomedicamentoSchema = z.object({
  medicacionId: z.number().int(),
  horaprogramada: z.coerce.date(),
  frecuencia: z.string().nullable().optional(),
  diasemana: z.number().int().nullable().optional(),
  generarecordatorio: z.boolean().optional(),
  proximaalarma: z.coerce.date().nullable().optional(),
  estadorecordatorio: z.string().optional(),
  ultimoenvio: z.coerce.date().nullable().optional(),
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
export class UpdateHorariomedicamentoDto extends createZodDto(updateHorariomedicamentoSchema) {}

