import { createZodDto } from "nestjs-zod";
import { z } from "zod";

/**
 * Esquema Zod utilizado por reset password.
 */
export const resetPasswordSchema = z.object({
  token: z.string().min(10).max(100),
  password: z.string().min(6).max(128),
});

/**
 * DTO de entrada para reset password.
 */
export class ResetPasswordDto extends createZodDto(resetPasswordSchema) {}
