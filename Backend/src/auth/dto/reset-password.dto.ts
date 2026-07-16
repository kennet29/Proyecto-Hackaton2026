import { createZodDto } from "nestjs-zod";
import { z } from "zod";

/**
 * Esquema Zod utilizado por reset password.
 */
export const resetPasswordSchema = z.object({
  token: z.string().trim().min(4).max(100),
  password: z.string()
    .min(8)
    .max(128)
    .regex(/[A-ZÁÉÍÓÚÑ]/, "incluye al menos una mayuscula")
    .regex(/\d/, "incluye al menos un numero"),
});

/**
 * DTO de entrada para reset password.
 */
export class ResetPasswordDto extends createZodDto(resetPasswordSchema) {}
