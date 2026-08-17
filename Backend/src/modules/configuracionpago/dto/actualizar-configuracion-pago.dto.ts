import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const actualizarConfiguracionPagoSchema = z.object({
  titularCuenta: z.string().trim().max(120).nullable().optional(),
  numeroCuenta: z.string().trim().max(80).nullable().optional(),
  moneda: z.string().trim().min(1).max(10).optional(),
  tipoCambio: z.number().positive().nullable().optional(),
  activo: z.boolean().optional(),
});

export class ActualizarConfiguracionPagoDto extends createZodDto(actualizarConfiguracionPagoSchema) {}
