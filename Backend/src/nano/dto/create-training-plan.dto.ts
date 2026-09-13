import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const trainingSafetyFlags = [
  "injury",
  "pain",
  "high-risk-pregnancy",
  "cardiovascular-condition",
] as const;
export type TrainingSafetyFlag = (typeof trainingSafetyFlags)[number];

export const createTrainingPlanSchema = z.object({
  goalKey: z.string().trim().min(2).max(60),
  goalLabel: z.string().trim().min(2).max(120),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  equipment: z.string().trim().min(1).max(500).optional(),
  limitations: z.string().trim().min(1).max(500).optional(),
  safetyFlags: z.array(z.enum(trainingSafetyFlags)).max(trainingSafetyFlags.length).optional().default([]),
});

/** Datos textuales para crear una rutina semanal, sin imágenes. */
export class CreateTrainingPlanDto extends createZodDto(createTrainingPlanSchema) {}
