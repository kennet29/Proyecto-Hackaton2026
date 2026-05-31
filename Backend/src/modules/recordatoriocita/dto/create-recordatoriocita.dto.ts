import { createZodDto } from "nestjs-zod";
import { z } from "zod";

/**
 * Esquema Zod para validar la creación de recordatoriocita.
 */
export const createRecordatoriocitaSchema = z.object({
  citaId: z.number().int(),
  pacienteId: z.number().int(),
  fecharecordatorio: z.coerce.date(),
  mensaje: z.string(),
  canal: z.string().nullable().optional(),
  estado: z.string().optional(),
  intentos: z.number().int().optional(),
  ultimointento: z.coerce.date().nullable().optional(),
  proximaejecucion: z.coerce.date().nullable().optional(),
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
 * DTO de entrada para crear recordatoriocita.
 */
export class CreateRecordatoriocitaDto extends createZodDto(
  createRecordatoriocitaSchema,
) {}

/**
 * Esquema Zod para validar la actualización de recordatoriocita.
 */
export const updateRecordatoriocitaSchema = z
  .object({
    citaId: z.number().int(),
    pacienteId: z.number().int(),
    fecharecordatorio: z.coerce.date(),
    mensaje: z.string(),
    canal: z.string().nullable().optional(),
    estado: z.string().optional(),
    intentos: z.number().int().optional(),
    ultimointento: z.coerce.date().nullable().optional(),
    proximaejecucion: z.coerce.date().nullable().optional(),
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
 * DTO de entrada para actualizar recordatoriocita.
 */
export class UpdateRecordatoriocitaDto extends createZodDto(
  updateRecordatoriocitaSchema,
) {}
