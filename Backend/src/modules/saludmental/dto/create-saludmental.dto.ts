import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const scoreSchema = z.number().int().min(1).max(5);
const decimalHourSchema = z.number().min(0).max(24);
const positiveMinutesSchema = z.number().int().min(0).max(1440);

export const createSaludmentalSchema = z.object({
  pacienteId: z.number().int(),
  fecha: z.coerce.date(),
  estadoAnimo: scoreSchema,
  estres: scoreSchema,
  ansiedad: scoreSchema,
  horasSueno: decimalHourSchema.optional(),
  notaPersonal: z.string().trim().max(2500).optional(),
  ejercicioMinutos: positiveMinutesSchema.optional(),
  hidratacionLitros: z.number().min(0).max(20).optional(),
  descansoHoras: decimalHourSchema.optional(),
  tiempoSocialMinutos: positiveMinutesSchema.optional(),
  pausasDigitales: z.number().int().min(0).max(100).optional(),
  creadoPor: z.string().trim().max(60).optional(),
  creadoEn: z.coerce.date().optional(),
  modificadoPor: z.string().trim().max(60).optional(),
  modificadoEn: z.coerce.date().optional(),
  campoPrueba01: z.string().trim().max(200).optional(),
  campoPrueba02: z.string().trim().max(200).optional(),
  campoPrueba03: z.string().trim().max(200).optional(),
  campoPrueba04: z.string().trim().max(200).optional(),
  campoPrueba05: z.string().trim().max(200).optional(),
});

export class CreateSaludmentalDto extends createZodDto(createSaludmentalSchema) {}

export const updateSaludmentalSchema = createSaludmentalSchema
  .omit({ pacienteId: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'debes enviar al menos un campo',
  });

export class UpdateSaludmentalDto extends createZodDto(updateSaludmentalSchema) {}
