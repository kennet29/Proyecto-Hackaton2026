import { createZodDto } from "nestjs-zod";
import { z } from "zod";

/**
 * Valor reutilizable asociado a tipo evento opciones.
 */
export const tipoEventoOpciones = [
  "operacion",
  "lesion",
  "emergencia",
] as const;
/**
 * Valor reutilizable asociado a estado seguimiento opciones.
 */
export const estadoSeguimientoOpciones = [
  "activo",
  "en observacion",
  "cerrado",
] as const;

const nullableString = z.string().trim().nullable().optional();

/**
 * Esquema Zod para validar la creación de seguimientopostevento.
 */
export const createSeguimientoposteventoSchema = z.object({
  pacienteId: z.number().int().positive(),
  tipoEvento: z.enum(tipoEventoOpciones),
  operacionId: z.number().int().positive().nullable().optional(),
  lesionId: z.number().int().positive().nullable().optional(),
  tituloEvento: z.string().trim().min(1).max(160),
  fechaEvento: z.coerce.date(),
  fechaSeguimiento: z.coerce.date().optional(),
  estado: z.enum(estadoSeguimientoOpciones).default("activo"),
  evolucion: z.string().trim().max(20000).nullable().optional(),
  sintomas: z.string().trim().max(20000).nullable().optional(),
  nivelDolor: z.number().int().min(0).max(10).nullable().optional(),
  medicacionActual: z.string().trim().max(20000).nullable().optional(),
  cuidadosHogar: z.string().trim().max(20000).nullable().optional(),
  notas: z.string().trim().max(20000).nullable().optional(),
  compartirConMedico: z.boolean().optional(),
  requiereAtencion: z.boolean().optional(),
  proximoControl: z.coerce.date().nullable().optional(),
  creadoPor: nullableString,
  creadoEn: z.coerce.date().optional(),
  modificadoPor: nullableString,
  modificadoEn: z.coerce.date().nullable().optional(),
  campoPrueba01: nullableString,
  campoPrueba02: nullableString,
  campoPrueba03: nullableString,
  campoPrueba04: nullableString,
  campoPrueba05: nullableString,
});

/**
 * DTO de entrada para crear seguimientopostevento.
 */
export class CreateSeguimientoposteventoDto extends createZodDto(
  createSeguimientoposteventoSchema,
) {}
