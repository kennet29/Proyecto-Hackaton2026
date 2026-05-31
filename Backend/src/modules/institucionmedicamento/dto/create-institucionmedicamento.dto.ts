import { createZodDto } from "nestjs-zod";
import { z } from "zod";

/**
 * Valor reutilizable asociado a disponibilidad medicamento opciones.
 */
export const disponibilidadMedicamentoOpciones = [
  "disponible",
  "limitado",
  "agotado",
  "por_encargo",
] as const;

/**
 * Esquema Zod para validar la creación de institucionmedicamento.
 */
export const createInstitucionmedicamentoSchema = z.object({
  institucionSaludId: z.number().int().positive(),
  medicamentoRaroId: z.number().int().positive(),
  disponibilidad: z.enum(disponibilidadMedicamentoOpciones).optional(),
  cantidadEstimada: z.number().int().min(0).nullable().optional(),
  precioReferencia: z.number().min(0).nullable().optional(),
  moneda: z.string().trim().max(10).nullable().optional(),
  fechaUltimaActualizacion: z.coerce.date().optional(),
  contactoAbastecimiento: z.string().trim().max(160).nullable().optional(),
  observaciones: z.string().trim().max(400).nullable().optional(),
  creadoPor: z.string().trim().max(60).nullable().optional(),
  creadoEn: z.coerce.date().optional(),
  modificadoPor: z.string().trim().max(60).nullable().optional(),
  modificadoEn: z.coerce.date().nullable().optional(),
});

/**
 * DTO de entrada para crear institucionmedicamento.
 */
export class CreateInstitucionmedicamentoDto extends createZodDto(
  createInstitucionmedicamentoSchema,
) {}
