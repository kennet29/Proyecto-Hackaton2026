import { createZodDto } from "nestjs-zod";
import { z } from "zod";

const passwordHashField = z
  .string()
  .min(1, "hashpassword es requerido")
  .transform((value) => Buffer.from(value, "utf8"));

/**
 * Esquema Zod para validar la creación de usuario.
 */
export const createUsuarioSchema = z.object({
  pacienteId: z.number().int().nullable().optional(),
  nombreusuario: z.string(),
  hashpassword: passwordHashField,
  rolprincipal: z.string().optional(),
  activo: z.boolean().optional(),
  ultimoingreso: z.coerce.date().nullable().optional(),
  fechacreacion: z.coerce.date().optional(),
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
 * DTO de entrada para crear usuario.
 */
export class CreateUsuarioDto extends createZodDto(createUsuarioSchema) {}

/**
 * Esquema Zod para validar la actualización de usuario.
 */
export const updateUsuarioSchema = z
  .object({
    pacienteId: z.number().int().nullable().optional(),
    nombreusuario: z.string(),
    hashpassword: passwordHashField,
    rolprincipal: z.string().optional(),
    activo: z.boolean().optional(),
    ultimoingreso: z.coerce.date().nullable().optional(),
    fechacreacion: z.coerce.date().optional(),
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
 * DTO de entrada para actualizar usuario.
 */
export class UpdateUsuarioDto extends createZodDto(updateUsuarioSchema) {}
