import { createZodDto } from "nestjs-zod";
import { z } from "zod";

/**
 * Esquema Zod para validar la creación de evaluacionsaludhabito.
 */
export const createEvaluacionsaludhabitoSchema = z.object({
  pacienteId: z.number().int(),
  fecha: z.coerce.date().optional(),
  puntaje: z.number(),
  categoria: z.string().nullable().optional(),
  resumen: z.string().nullable().optional(),
  detalle: z.string().nullable().optional(),
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
/**
 * DTO de entrada para crear evaluacionsaludhabito.
 */
export class CreateEvaluacionsaludhabitoDto extends createZodDto(
  createEvaluacionsaludhabitoSchema,
) {}

/**
 * Esquema Zod para validar la actualización de evaluacionsaludhabito.
 */
export const updateEvaluacionsaludhabitoSchema = z
  .object({
    pacienteId: z.number().int(),
    fecha: z.coerce.date().optional(),
    puntaje: z.number(),
    categoria: z.string().nullable().optional(),
    resumen: z.string().nullable().optional(),
    detalle: z.string().nullable().optional(),
    creadopor: z.string().nullable().optional(),
    creadoen: z.coerce.date().optional(),
    modificadopor: z.string().nullable().optional(),
    modificadoen: z.coerce.date().nullable().optional(),
    campoprueba01: z.string().nullable().optional(),
    campoprueba02: z.string().nullable().optional(),
    campoprueba03: z.string().nullable().optional(),
    campoprueba04: z.string().nullable().optional(),
    campoprueba05: z.string().nullable().optional(),
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "debes enviar al menos un campo",
  });
/**
 * DTO de entrada para actualizar evaluacionsaludhabito.
 */
export class UpdateEvaluacionsaludhabitoDto extends createZodDto(
  updateEvaluacionsaludhabitoSchema,
) {}
