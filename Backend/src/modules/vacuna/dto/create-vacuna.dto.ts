import { createZodDto } from "nestjs-zod";
import { z } from "zod";

/**
 * Esquema Zod para validar la creación de vacuna.
 */
export const createVacunaSchema = z.object({
  pacienteId: z.number().int(),
  tipovacunaId: z.number().int().nullable().optional(),
  nombre: z.string(),
  fechaaplicacion: z.coerce.date(),
  lote: z.string().nullable().optional(),
  proximadosis: z.coerce.date().nullable().optional(),
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
 * DTO de entrada para crear vacuna.
 */
export class CreateVacunaDto extends createZodDto(createVacunaSchema) {}

/**
 * Esquema Zod para validar la actualización de vacuna.
 */
export const updateVacunaSchema = z
  .object({
    pacienteId: z.number().int(),
    tipovacunaId: z.number().int().nullable().optional(),
    nombre: z.string(),
    fechaaplicacion: z.coerce.date(),
    lote: z.string().nullable().optional(),
    proximadosis: z.coerce.date().nullable().optional(),
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
 * DTO de entrada para actualizar vacuna.
 */
export class UpdateVacunaDto extends createZodDto(updateVacunaSchema) {}
