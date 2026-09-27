import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const createCalmMissionsSchema = z.object({
  emotion: z.string().trim().min(2).max(60).optional(),
  stressLevel: z.coerce.number().int().min(1).max(5),
  anxietyLevel: z.coerce.number().int().min(1).max(5),
  context: z.string().trim().min(1).max(500).optional(),
});

/** Contexto emocional para generar misiones breves y no clínicas de bienestar. */
export class CreateCalmMissionsDto extends createZodDto(createCalmMissionsSchema) {}
