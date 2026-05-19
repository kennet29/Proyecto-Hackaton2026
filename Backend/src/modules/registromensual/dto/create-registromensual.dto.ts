import { createZodDto } from "nestjs-zod";
import { z } from "zod";

/**
 * Esquema Zod para validar la creación de registromensual.
 */
export const createRegistromensualSchema = z.object({
  pacienteId: z.number().int(),
  mes: z.number().int().nullable().optional(),
  anio: z.number().int(),
  fechainicio: z.coerce.date(),
  duraciondias: z.number().int().nullable().optional(),
  dolor: z.string().nullable().optional(),
  sintomas: z.string().nullable().optional(),
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
 * DTO de entrada para crear registromensual.
 */
export class CreateRegistromensualDto extends createZodDto(
  createRegistromensualSchema,
) {}

/**
 * Esquema Zod para validar la actualización de registromensual.
 */
export const updateRegistromensualSchema = z
  .object({
    pacienteId: z.number().int(),
    mes: z.number().int().nullable().optional(),
    anio: z.number().int(),
    fechainicio: z.coerce.date(),
    duraciondias: z.number().int().nullable().optional(),
    dolor: z.string().nullable().optional(),
    sintomas: z.string().nullable().optional(),
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
 * DTO de entrada para actualizar registromensual.
 */
export class UpdateRegistromensualDto extends createZodDto(
  updateRegistromensualSchema,
) {}
