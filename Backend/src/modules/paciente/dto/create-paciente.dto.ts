import { createZodDto } from "nestjs-zod";
import { z } from "zod";

/**
 * Esquema Zod para validar la creación de paciente.
 */
export const createPacienteSchema = z.object({
  nombres: z.string(),
  apellidos: z.string(),
  fechanacimiento: z.coerce.date().nullable().optional(),
  sexo: z.string().nullable().optional(),
  tipodocumento: z.string().nullable().optional(),
  numerodocumento: z.string().nullable().optional(),
  telefono: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  direccion: z.string().nullable().optional(),
  fecharegistro: z.coerce.date().optional(),
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
 * DTO de entrada para crear paciente.
 */
export class CreatePacienteDto extends createZodDto(createPacienteSchema) {}

/**
 * Esquema Zod para validar la actualización de paciente.
 */
export const updatePacienteSchema = z
  .object({
    nombres: z.string(),
    apellidos: z.string(),
    fechanacimiento: z.coerce.date().nullable().optional(),
    sexo: z.string().nullable().optional(),
    tipodocumento: z.string().nullable().optional(),
    numerodocumento: z.string().nullable().optional(),
    telefono: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
    direccion: z.string().nullable().optional(),
    fecharegistro: z.coerce.date().optional(),
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
 * DTO de entrada para actualizar paciente.
 */
export class UpdatePacienteDto extends createZodDto(updatePacienteSchema) {}
