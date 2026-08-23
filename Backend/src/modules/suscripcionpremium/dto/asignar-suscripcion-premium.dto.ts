/**
 * @file Backend/src/modules/suscripcionpremium/dto/asignar-suscripcion-premium.dto.ts
 * @description TypeScript module implementation.
 */

import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const asignarSuscripcionPremiumSchema = z.object({
  usuarioId: z.number().int().positive(),
  plan: z.enum(["mensual", "trimestral"]),
});

export class AsignarSuscripcionPremiumDto extends createZodDto(
  asignarSuscripcionPremiumSchema,
) {}
