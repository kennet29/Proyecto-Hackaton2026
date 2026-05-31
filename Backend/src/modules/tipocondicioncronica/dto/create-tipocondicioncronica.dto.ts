import { createZodDto } from "nestjs-zod";
import { z } from "zod";

/**
 * Esquema Zod para validar la creación de tipocondicioncronica.
 */
export const createTipocondicioncronicaSchema = z.object({
  nombre: z.string(),
  descripcion: z.string().nullable().optional(),
  categoria: z.string().nullable().optional(),
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
 * DTO de entrada para crear tipocondicioncronica.
 */
export class CreateTipocondicioncronicaDto extends createZodDto(
  createTipocondicioncronicaSchema,
) {}

/**
 * Esquema Zod para validar la actualización de tipocondicioncronica.
 */
export const updateTipocondicioncronicaSchema = z
  .object({
    nombre: z.string(),
    descripcion: z.string().nullable().optional(),
    categoria: z.string().nullable().optional(),
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
 * DTO de entrada para actualizar tipocondicioncronica.
 */
export class UpdateTipocondicioncronicaDto extends createZodDto(
  updateTipocondicioncronicaSchema,
) {}
