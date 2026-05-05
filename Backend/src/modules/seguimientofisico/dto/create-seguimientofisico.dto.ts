import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const intensidadOpciones = ['leve', 'moderada', 'intensa'] as const;

export const createSeguimientofisicoSchema = z.object({
  pacienteId: z.number().int().positive(),
  fecha: z.coerce.date(),
  peso: z.number().min(1).max(500).nullable().optional(),
  minutosEjercicio: z.number().int().min(0).max(1440).nullable().optional(),
  tipoEjercicio: z.string().trim().max(120).nullable().optional(),
  intensidad: z.enum(intensidadOpciones).nullable().optional(),
  pasos: z.number().int().min(0).max(200000).nullable().optional(),
  caloriasQuemadas: z.number().int().min(0).max(20000).nullable().optional(),
  distanciaKm: z.number().min(0).max(500).nullable().optional(),
  notas: z.string().trim().max(4000).nullable().optional(),
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

export class CreateSeguimientofisicoDto extends createZodDto(
  createSeguimientofisicoSchema,
) {}
