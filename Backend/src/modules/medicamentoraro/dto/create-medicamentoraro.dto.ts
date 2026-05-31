import { createZodDto } from "nestjs-zod";
import { z } from "zod";

/**
 * Esquema Zod para validar la creación de medicamentoraro.
 */
export const createMedicamentoraroSchema = z.object({
  nombreGenerico: z.string().trim().min(1).max(160),
  nombreComercial: z.string().trim().max(160).nullable().optional(),
  presentacion: z.string().trim().max(120).nullable().optional(),
  concentracion: z.string().trim().max(120).nullable().optional(),
  fabricante: z.string().trim().max(120).nullable().optional(),
  descripcion: z.string().trim().max(500).nullable().optional(),
  requiereReceta: z.boolean().optional(),
  controlado: z.boolean().optional(),
  notasAbastecimiento: z.string().trim().max(400).nullable().optional(),
  activo: z.boolean().optional(),
  creadoPor: z.string().trim().max(60).nullable().optional(),
  creadoEn: z.coerce.date().optional(),
  modificadoPor: z.string().trim().max(60).nullable().optional(),
  modificadoEn: z.coerce.date().nullable().optional(),
});

/**
 * DTO de entrada para crear medicamentoraro.
 */
export class CreateMedicamentoraroDto extends createZodDto(
  createMedicamentoraroSchema,
) {}
