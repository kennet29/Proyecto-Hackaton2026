import { createZodDto } from "nestjs-zod";
import { z } from "zod";

/**
 * Esquema Zod para validar la creación de tipodocumentoclinico.
 */
export const createTipodocumentoclinicoSchema = z.object({
  nombre: z.string(),
  descripcion: z.string().nullable().optional(),
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
 * DTO de entrada para crear tipodocumentoclinico.
 */
export class CreateTipodocumentoclinicoDto extends createZodDto(
  createTipodocumentoclinicoSchema,
) {}

/**
 * Esquema Zod para validar la actualización de tipodocumentoclinico.
 */
export const updateTipodocumentoclinicoSchema = z
  .object({
    nombre: z.string(),
    descripcion: z.string().nullable().optional(),
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
 * DTO de entrada para actualizar tipodocumentoclinico.
 */
export class UpdateTipodocumentoclinicoDto extends createZodDto(
  updateTipodocumentoclinicoSchema,
) {}
