import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const claimPermisoAccesoCodeSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "el codigo debe contener exactamente 6 numeros"),
});

export class ClaimPermisoAccesoCodeDto extends createZodDto(
  claimPermisoAccesoCodeSchema,
) {}
