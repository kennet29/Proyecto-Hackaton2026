import { createZodDto } from "nestjs-zod";
import { z } from "zod";

/**
 * Esquema Zod para validar la creación de registrodental.
 */
export const createRegistrodentalSchema = z.object({
  pacienteId: z.number().int(),
  fechaatencion: z.coerce.date(),
  procedimiento: z.string(),
  diagnostico: z.string().nullable().optional(),
  odontologo: z.string().nullable().optional(),
  piezastratadas: z.string().nullable().optional(),
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
/**
 * DTO de entrada para crear registrodental.
 */
export class CreateRegistrodentalDto extends createZodDto(
  createRegistrodentalSchema,
) {}

/**
 * Esquema Zod para validar la actualización de registrodental.
 */
export const updateRegistrodentalSchema = z
  .object({
    pacienteId: z.number().int(),
    fechaatencion: z.coerce.date(),
    procedimiento: z.string(),
    diagnostico: z.string().nullable().optional(),
    odontologo: z.string().nullable().optional(),
    piezastratadas: z.string().nullable().optional(),
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
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "debes enviar al menos un campo",
  });
/**
 * DTO de entrada para actualizar registrodental.
 */
export class UpdateRegistrodentalDto extends createZodDto(
  updateRegistrodentalSchema,
) {}
