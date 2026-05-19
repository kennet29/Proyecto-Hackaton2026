import { createZodDto } from "nestjs-zod";
import { z } from "zod";

/**
 * Esquema Zod para validar la creación de citamedica.
 */
export const createCitamedicaSchema = z.object({
  pacienteId: z.number().int(),
  especialidadId: z.number().int().nullable().optional(),
  fechacita: z.coerce.date(),
  especialidad: z.string().nullable().optional(),
  motivo: z.string().nullable().optional(),
  medico: z.string().nullable().optional(),
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
 * DTO de entrada para crear citamedica.
 */
export class CreateCitamedicaDto extends createZodDto(createCitamedicaSchema) {}

/**
 * Esquema Zod para validar la actualización de citamedica.
 */
export const updateCitamedicaSchema = z
  .object({
    pacienteId: z.number().int(),
    especialidadId: z.number().int().nullable().optional(),
    fechacita: z.coerce.date(),
    especialidad: z.string().nullable().optional(),
    motivo: z.string().nullable().optional(),
    medico: z.string().nullable().optional(),
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
 * DTO de entrada para actualizar citamedica.
 */
export class UpdateCitamedicaDto extends createZodDto(updateCitamedicaSchema) {}
