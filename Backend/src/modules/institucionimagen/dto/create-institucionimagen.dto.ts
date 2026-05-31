import { createZodDto } from "nestjs-zod";
import { z } from "zod";

/**
 * Valor reutilizable asociado a tipos imagen institucion.
 */
export const tiposImagenInstitucion = [
  "logo",
  "fachada",
  "interior",
  "laboratorio",
  "equipo",
  "otra",
] as const;

/**
 * Esquema Zod para validar la creación de institucionimagen.
 */
export const createInstitucionimagenSchema = z.object({
  institucionSaludId: z.number().int().positive(),
  tipoImagen: z.enum(tiposImagenInstitucion).optional(),
  titulo: z.string().trim().max(120).nullable().optional(),
  descripcion: z.string().trim().max(250).nullable().optional(),
  nombreArchivo: z.string().trim().max(180).nullable().optional(),
  mimeType: z.string().trim().max(120),
  imagenBase64: z.string().trim().min(1),
  esPrincipal: z.boolean().optional(),
  ordenVisual: z.number().int().min(0).nullable().optional(),
  activo: z.boolean().optional(),
  creadoPor: z.string().trim().max(60).nullable().optional(),
  creadoEn: z.coerce.date().optional(),
  modificadoPor: z.string().trim().max(60).nullable().optional(),
  modificadoEn: z.coerce.date().nullable().optional(),
});

/**
 * DTO de entrada para crear institucionimagen.
 */
export class CreateInstitucionimagenDto extends createZodDto(
  createInstitucionimagenSchema,
) {}
