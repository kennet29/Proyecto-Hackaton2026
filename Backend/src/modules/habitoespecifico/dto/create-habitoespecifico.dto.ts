import { createZodDto } from "nestjs-zod";
import { z } from "zod";

/**
 * Esquema Zod para validar la creación de habitoespecifico.
 */
export const createHabitoespecificoSchema = z.object({
  pacienteId: z.number().int(),
  tipohabitoId: z.number().int(),
  categoria: z.string().nullable().optional(),
  nivel: z.string().nullable().optional(),
  frecuencia: z.string().nullable().optional(),
  cantidad: z.number().nullable().optional(),
  unidad: z.string().nullable().optional(),
  inicio: z.coerce.date().nullable().optional(),
  fin: z.coerce.date().nullable().optional(),
  impactosalud: z.string().nullable().optional(),
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
/**
 * DTO de entrada para crear habitoespecifico.
 */
export class CreateHabitoespecificoDto extends createZodDto(
  createHabitoespecificoSchema,
) {}

/**
 * Esquema Zod para validar la actualización de habitoespecifico.
 */
export const updateHabitoespecificoSchema = z
  .object({
    pacienteId: z.number().int(),
    tipohabitoId: z.number().int(),
    categoria: z.string().nullable().optional(),
    nivel: z.string().nullable().optional(),
    frecuencia: z.string().nullable().optional(),
    cantidad: z.number().nullable().optional(),
    unidad: z.string().nullable().optional(),
    inicio: z.coerce.date().nullable().optional(),
    fin: z.coerce.date().nullable().optional(),
    impactosalud: z.string().nullable().optional(),
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
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "debes enviar al menos un campo",
  });
/**
 * DTO de entrada para actualizar habitoespecifico.
 */
export class UpdateHabitoespecificoDto extends createZodDto(
  updateHabitoespecificoSchema,
) {}
