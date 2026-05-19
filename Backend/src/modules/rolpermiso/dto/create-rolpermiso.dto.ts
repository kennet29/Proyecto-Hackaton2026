import { createZodDto } from "nestjs-zod";
import { z } from "zod";

/**
 * Esquema Zod para validar la creación de rolpermiso.
 */
export const createRolpermisoSchema = z.object({
  rolId: z.number().int(),
  permisoId: z.number().int(),
  creadopor: z.string().nullable().optional(),
  creadoen: z.coerce.date().optional(),
  campoprueba01: z.string().nullable().optional(),
  campoprueba02: z.string().nullable().optional(),
  campoprueba03: z.string().nullable().optional(),
  campoprueba04: z.string().nullable().optional(),
  campoprueba05: z.string().nullable().optional(),
});
/**
 * DTO de entrada para crear rolpermiso.
 */
export class CreateRolpermisoDto extends createZodDto(createRolpermisoSchema) {}

/**
 * Esquema Zod para validar la actualización de rolpermiso.
 */
export const updateRolpermisoSchema = z
  .object({
    rolId: z.number().int(),
    permisoId: z.number().int(),
    creadopor: z.string().nullable().optional(),
    creadoen: z.coerce.date().optional(),
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
 * DTO de entrada para actualizar rolpermiso.
 */
export class UpdateRolpermisoDto extends createZodDto(updateRolpermisoSchema) {}
