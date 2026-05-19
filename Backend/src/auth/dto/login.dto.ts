import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { fingerprintTemplateSchema } from "../../common/schemas/fingerprint.schema";

/**
 * Esquema Zod utilizado por login.
 */
export const loginSchema = z
  .object({
    username: z.string().min(3).max(60),
    password: z.string().min(6).max(128).optional(),
    fingerprintTemplate: fingerprintTemplateSchema.optional(),
  })
  .refine(
    (value) => Boolean(value.password) !== Boolean(value.fingerprintTemplate),
    {
      message: "debes enviar contraseña o huella digital",
      path: ["password"],
    },
  );

/**
 * DTO usado por el flujo login.
 */
export class LoginDto extends createZodDto(loginSchema) {}
