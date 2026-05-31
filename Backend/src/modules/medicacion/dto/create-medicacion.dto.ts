import { createZodDto } from "nestjs-zod";
import { z } from "zod";

const nullableString = z.string().trim().nullable().optional();

/**
 * Esquema Zod para validar la creación de medicacion.
 */
export const createMedicacionSchema = z.object({
  pacienteId: z.number().int(),
  consultaId: z.number().int().nullable().optional(),
  nombremedicamento: z.string(),
  presentacion: z.string().nullable().optional(),
  dosis: z.string().nullable().optional(),
  viaadministracion: z.string().nullable().optional(),
  indicaciones: z.string().nullable().optional(),
  fechainicio: z.coerce.date(),
  fechafin: z.coerce.date().nullable().optional(),
  medicacionactiva: z.boolean().optional(),
  archivoRecetaBase64: nullableString,
  nombreArchivoReceta: z.string().trim().max(200).nullable().optional(),
  mimeArchivoReceta: z.string().trim().max(100).nullable().optional(),
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
 * DTO de entrada para crear medicacion.
 */
export class CreateMedicacionDto extends createZodDto(createMedicacionSchema) {}

/**
 * Esquema Zod para validar la actualización de medicacion.
 */
export const updateMedicacionSchema = z
  .object({
    pacienteId: z.number().int(),
    consultaId: z.number().int().nullable().optional(),
    nombremedicamento: z.string(),
    presentacion: z.string().nullable().optional(),
    dosis: z.string().nullable().optional(),
    viaadministracion: z.string().nullable().optional(),
    indicaciones: z.string().nullable().optional(),
    fechainicio: z.coerce.date(),
    fechafin: z.coerce.date().nullable().optional(),
    medicacionactiva: z.boolean().optional(),
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
 * DTO de entrada para actualizar medicacion.
 */
export class UpdateMedicacionDto extends createZodDto(updateMedicacionSchema) {}
