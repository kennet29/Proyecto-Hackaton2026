import { createZodDto } from "nestjs-zod";
import { z } from "zod";

const symptomListSchema = z.array(z.string().trim().min(1)).max(30);

/**
 * Esquema Zod para validar la creación de periodo.
 */
export const createPeriodoSchema = z.object({
  pacienteId: z.number().int(),
  fechaInicio: z.coerce.date(),
  fechaFin: z.coerce.date().optional(),
  duracionDias: z.number().int().positive().max(15).optional(),
  cicloDias: z.number().int().positive().max(90).optional(),
  flujo: z.enum(["leve", "moderado", "abundante"]).optional(),
  dolor: z.enum(["sin_dolor", "leve", "moderado", "intenso"]).optional(),
  sintomas: symptomListSchema.optional(),
  observaciones: z.string().trim().max(2000).optional(),
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

/**
 * DTO de entrada para crear periodo.
 */
export class CreatePeriodoDto extends createZodDto(createPeriodoSchema) {}

/**
 * Esquema Zod para validar la actualización de periodo.
 */
export const updatePeriodoSchema = createPeriodoSchema
  .omit({ pacienteId: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "debes enviar al menos un campo",
  });

/**
 * DTO de entrada para actualizar periodo.
 */
export class UpdatePeriodoDto extends createZodDto(updatePeriodoSchema) {}
