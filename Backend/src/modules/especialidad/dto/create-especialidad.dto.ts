import { createZodDto } from "nestjs-zod";
import { z } from "zod";

/**
 * Esquema Zod para validar la creación de especialidad.
 */
export const createEspecialidadSchema = z.object({
  nombre: z.string(),
  descripcion: z.string().nullable().optional(),
  activo: z.boolean().optional(),
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
 * DTO de entrada para crear especialidad.
 */
export class CreateEspecialidadDto extends createZodDto(
  createEspecialidadSchema,
) {}

/**
 * Esquema Zod para validar la actualización de especialidad.
 */
export const updateEspecialidadSchema = z
  .object({
    nombre: z.string(),
    descripcion: z.string().nullable().optional(),
    activo: z.boolean().optional(),
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
 * DTO de entrada para actualizar especialidad.
 */
export class UpdateEspecialidadDto extends createZodDto(
  updateEspecialidadSchema,
) {}
