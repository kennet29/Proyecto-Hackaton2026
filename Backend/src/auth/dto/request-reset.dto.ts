import { createZodDto } from "nestjs-zod";
import { z } from "zod";

/**
 * Esquema Zod utilizado por request reset.
 */
export const requestResetSchema = z.object({
  username: z.string().min(3).max(60),
  securityQuestion: z.enum(["pet", "school", "city"]),
  securityAnswer: z.string().trim().min(2).max(100),
  altchaPayload: z.string().min(20).max(10000),
});

/**
 * DTO usado por el flujo request reset.
 */
export class RequestResetDto extends createZodDto(requestResetSchema) {}
