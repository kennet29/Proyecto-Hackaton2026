import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { fingerprintTemplateSchema } from "../../common/schemas/fingerprint.schema";

/**
 * Esquema Zod para validar la creación de user.
 */
export const createUserSchema = z.object({
  username: z.string().min(3).max(60),
  email: z.string().trim().email().max(120).optional(),
  password: z.string().min(6).max(128),
  city: z.string().trim().min(2).max(100).optional(),
  country: z.string().trim().min(2).max(100).optional(),
  pacienteId: z.number().int().positive().optional(),
  role: z.string().min(3).max(40).optional(),
  activo: z.boolean().optional(),
  fingerprintTemplate: fingerprintTemplateSchema.optional(),
  securityQuestion: z.enum(["pet", "school", "city"]),
  securityAnswer: z.string().trim().min(2).max(100),
});

/**
 * DTO de entrada para crear user.
 */
export class CreateUserDto extends createZodDto(createUserSchema) {}
