/**
 * @file Backend/src/nano/dto/select-nano-appearance.dto.ts
 * @description TypeScript module implementation.
 */

import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const nanoAppearanceIds = [
  "base",
  "valentin",
  "gladiador",
  "patriota",
  "halloween",
  "navideno",
] as const;

export const selectNanoAppearanceSchema = z.object({
  appearanceId: z.enum(nanoAppearanceIds),
});

export class SelectNanoAppearanceDto extends createZodDto(
  selectNanoAppearanceSchema,
) {}
