import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const createRecipeSchema = z.object({
  goalKey: z.string().trim().min(2).max(60),
  goalLabel: z.string().trim().min(2).max(120),
  ingredients: z.string().trim().min(3).max(1_000).optional(),
  allowNanoRecommendations: z.boolean().optional().default(false),
  preferences: z.string().trim().min(1).max(500).optional(),
});

/** Datos textuales para que Nano Chef genere una receta, sin imágenes. */
export class CreateRecipeDto extends createZodDto(createRecipeSchema) {}
