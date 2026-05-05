import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const nullableString = z.string().trim().nullable().optional();

export const createExamenclinicoSchema = z.object({
  pacienteId: z.number().int().positive(),
  consultaId: z.number().int().positive().nullable().optional(),
  nombreExamen: z.string().trim().min(1).max(160),
  tipoExamen: z.string().trim().max(120).nullable().optional(),
  laboratorio: z.string().trim().max(160).nullable().optional(),
  fechaExamen: z.coerce.date(),
  fechaResultado: z.coerce.date().nullable().optional(),
  resultadoTexto: z.string().trim().max(20000).nullable().optional(),
  observaciones: z.string().trim().max(20000).nullable().optional(),
  archivoPdfBase64: nullableString,
  nombreArchivoPdf: z.string().trim().max(260).nullable().optional(),
  creadoPor: z.string().trim().max(60).nullable().optional(),
  creadoEn: z.coerce.date().optional(),
  modificadoPor: z.string().trim().max(60).nullable().optional(),
  modificadoEn: z.coerce.date().nullable().optional(),
  campoPrueba01: z.string().trim().max(200).nullable().optional(),
  campoPrueba02: z.string().trim().max(200).nullable().optional(),
  campoPrueba03: z.string().trim().max(200).nullable().optional(),
  campoPrueba04: z.string().trim().max(200).nullable().optional(),
  campoPrueba05: z.string().trim().max(200).nullable().optional(),
});

export class CreateExamenclinicoDto extends createZodDto(createExamenclinicoSchema) {}

export const updateExamenclinicoSchema = createExamenclinicoSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'debes enviar al menos un campo',
  });

export class UpdateExamenclinicoDto extends createZodDto(updateExamenclinicoSchema) {}
