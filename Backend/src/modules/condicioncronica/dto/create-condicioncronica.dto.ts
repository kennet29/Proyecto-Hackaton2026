import { createZodDto } from "nestjs-zod";
import { z } from "zod";

/**
 * Esquema Zod para validar la creación de condicioncronica.
 */
export const createCondicioncronicaSchema = z.object({
  pacienteId: z.number().int(),
  tipocondicionId: z.number().int(),
  fechadiagnostico: z.coerce.date().nullable().optional(),
  estado: z.string().optional(),
  severidad: z.string().nullable().optional(),
  tratamientoprincipal: z.string().nullable().optional(),
  proveedorlider: z.string().nullable().optional(),
  proximoseguimiento: z.coerce.date().nullable().optional(),
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
 * DTO de entrada para crear condicioncronica.
 */
export class CreateCondicioncronicaDto extends createZodDto(
  createCondicioncronicaSchema,
) {}

/**
 * Esquema Zod para validar la actualización de condicioncronica.
 */
export const updateCondicioncronicaSchema = z
  .object({
    pacienteId: z.number().int(),
    tipocondicionId: z.number().int(),
    fechadiagnostico: z.coerce.date().nullable().optional(),
    estado: z.string().optional(),
    severidad: z.string().nullable().optional(),
    tratamientoprincipal: z.string().nullable().optional(),
    proveedorlider: z.string().nullable().optional(),
    proximoseguimiento: z.coerce.date().nullable().optional(),
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
 * DTO de entrada para actualizar condicioncronica.
 */
export class UpdateCondicioncronicaDto extends createZodDto(
  updateCondicioncronicaSchema,
) {}
