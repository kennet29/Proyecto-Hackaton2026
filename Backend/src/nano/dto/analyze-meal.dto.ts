import { createZodDto } from "nestjs-zod";
import { z } from "zod";

/**
 * Esquema Zod utilizado por analyze meal.
 */
export const analyzeMealSchema = z.object({
  goalKey: z.string().trim().min(2).max(60),
  goalLabel: z.string().trim().min(2).max(120),
  imageBase64: z.string().trim().min(20).max(12_000_000),
  imageMimeType: z.string().trim().min(6).max(80),
});

/**
 * DTO usado por el flujo analyze meal.
 */
export class AnalyzeMealDto extends createZodDto(analyzeMealSchema) {}
