import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { CATEGORIAS_GASTO_MEDICO } from "../gastomedico.entity";

const amount = z.coerce.number().finite().positive().max(9999999999.99);

export const actualizarLimiteSchema = z.object({ limit: amount });
export class ActualizarLimiteDto extends createZodDto(actualizarLimiteSchema) {}

export const guardarGastoSchema = z.object({
  description: z.string().trim().min(1).max(180),
  category: z.enum(CATEGORIAS_GASTO_MEDICO),
  amount,
});
export class GuardarGastoDto extends createZodDto(guardarGastoSchema) {}
