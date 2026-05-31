import { createZodDto } from "nestjs-zod";
import { z } from "zod";

/**
 * Esquema Zod para validar la creación de puntajeriesgo.
 */
export const createPuntajeriesgoSchema = z.object({
  pacienteId: z.number().int(),
  consultaId: z.number().int().nullable().optional(),
  tipo: z.string(),
  valordecimal: z.number().nullable().optional(),
  valortexto: z.string().nullable().optional(),
  unidad: z.string().nullable().optional(),
  rangoreferencia: z.string().nullable().optional(),
  clasificacion: z.string().nullable().optional(),
  fechamedicion: z.coerce.date().optional(),
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
 * DTO de entrada para crear puntajeriesgo.
 */
export class CreatePuntajeriesgoDto extends createZodDto(
  createPuntajeriesgoSchema,
) {}

/**
 * Esquema Zod para validar la actualización de puntajeriesgo.
 */
export const updatePuntajeriesgoSchema = z
  .object({
    pacienteId: z.number().int(),
    consultaId: z.number().int().nullable().optional(),
    tipo: z.string(),
    valordecimal: z.number().nullable().optional(),
    valortexto: z.string().nullable().optional(),
    unidad: z.string().nullable().optional(),
    rangoreferencia: z.string().nullable().optional(),
    clasificacion: z.string().nullable().optional(),
    fechamedicion: z.coerce.date().optional(),
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
 * DTO de entrada para actualizar puntajeriesgo.
 */
export class UpdatePuntajeriesgoDto extends createZodDto(
  updatePuntajeriesgoSchema,
) {}
