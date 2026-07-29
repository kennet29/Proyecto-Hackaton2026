import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const createPermisoAccesoCodeSchema = z.object({
  medicoId: z.number().int().positive(),
  notas: z.string().trim().max(200).optional(),
});

export class CreatePermisoAccesoCodeDto extends createZodDto(
  createPermisoAccesoCodeSchema,
) {}
