import { createZodDto } from "nestjs-zod";
import { z } from "zod";

/**
 * Esquema Zod para validar la creación de desparasitacion.
 */
export const createDesparasitacionSchema = z.object({
  pacienteId: z.number().int(),
  fecha: z.coerce.date(),
  producto: z.string(),
  dosis: z.string().nullable().optional(),
  proximafecha: z.coerce.date().nullable().optional(),
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
 * DTO de entrada para crear desparasitacion.
 */
export class CreateDesparasitacionDto extends createZodDto(
  createDesparasitacionSchema,
) {}

/**
 * Esquema Zod para validar la actualización de desparasitacion.
 */
export const updateDesparasitacionSchema = z
  .object({
    pacienteId: z.number().int(),
    fecha: z.coerce.date(),
    producto: z.string(),
    dosis: z.string().nullable().optional(),
    proximafecha: z.coerce.date().nullable().optional(),
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
 * DTO de entrada para actualizar desparasitacion.
 */
export class UpdateDesparasitacionDto extends createZodDto(
  updateDesparasitacionSchema,
) {}
