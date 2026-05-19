import { createZodDto } from "nestjs-zod";
import { z } from "zod";

/**
 * Esquema Zod para validar la creación de institucionservicio.
 */
export const createInstitucionservicioSchema = z.object({
  institucionSaludId: z.number().int().positive(),
  catalogoServicioId: z.number().int().positive(),
  precioReferencia: z.number().min(0).nullable().optional(),
  moneda: z.string().trim().max(10).nullable().optional(),
  tiempoEntrega: z.string().trim().max(120).nullable().optional(),
  disponible: z.boolean().optional(),
  observaciones: z.string().trim().max(400).nullable().optional(),
  creadoPor: z.string().trim().max(60).nullable().optional(),
  creadoEn: z.coerce.date().optional(),
  modificadoPor: z.string().trim().max(60).nullable().optional(),
  modificadoEn: z.coerce.date().nullable().optional(),
});

/**
 * DTO de entrada para crear institucionservicio.
 */
export class CreateInstitucionservicioDto extends createZodDto(
  createInstitucionservicioSchema,
) {}
