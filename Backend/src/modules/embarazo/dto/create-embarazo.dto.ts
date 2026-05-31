import { createZodDto } from "nestjs-zod";
import { z } from "zod";

/**
 * Esquema Zod para validar la creación de embarazo.
 */
export const createEmbarazoSchema = z.object({
  pacienteId: z.number().int(),
  fechainicio: z.coerce.date(),
  fechaprobableparto: z.coerce.date().nullable().optional(),
  numerocontrol: z.number().int().nullable().optional(),
  riesgo: z.string().nullable().optional(),
  estado: z.string().optional(),
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
 * DTO de entrada para crear embarazo.
 */
export class CreateEmbarazoDto extends createZodDto(createEmbarazoSchema) {}

/**
 * Esquema Zod para validar la actualización de embarazo.
 */
export const updateEmbarazoSchema = z
  .object({
    pacienteId: z.number().int(),
    fechainicio: z.coerce.date(),
    fechaprobableparto: z.coerce.date().nullable().optional(),
    numerocontrol: z.number().int().nullable().optional(),
    riesgo: z.string().nullable().optional(),
    estado: z.string().optional(),
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
 * DTO de entrada para actualizar embarazo.
 */
export class UpdateEmbarazoDto extends createZodDto(updateEmbarazoSchema) {}
