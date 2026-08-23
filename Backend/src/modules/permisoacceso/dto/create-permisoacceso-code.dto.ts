/**
 * @file Backend/src/modules/permisoacceso/dto/create-permisoacceso-code.dto.ts
 * @description TypeScript module implementation.
 */

import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const createPermisoAccesoCodeSchema = z.object({
  notas: z.string().trim().max(200).optional(),
});

export class CreatePermisoAccesoCodeDto extends createZodDto(
  createPermisoAccesoCodeSchema,
) {}
