import { createZodDto } from "nestjs-zod";
import { z } from "zod";

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const toLocalDateOnly = (value: unknown): Date | null => {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const normalize = (dateValue: Date) =>
    new Date(
      dateValue.getFullYear(),
      dateValue.getMonth(),
      dateValue.getDate(),
    );

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null;
    }
    return normalize(value);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    const [datePart] = trimmed.split("T");
    const segments = datePart.split("-").map((segment) => Number(segment));
    if (
      segments.length === 3 &&
      segments.every((segment) => !Number.isNaN(segment))
    ) {
      const [year, month, day] = segments;
      return new Date(year, month - 1, day);
    }
    const fallback = new Date(trimmed);
    if (!Number.isNaN(fallback.getTime())) {
      return normalize(fallback);
    }
    return null;
  }

  return null;
};

const dateOnlyField = z
  .preprocess(
    (value) => {
      if (value === null || value === undefined || value === "") {
        return null;
      }

      if (value instanceof Date) {
        if (Number.isNaN(value.getTime())) {
          return value;
        }

        const year = value.getFullYear();
        const month = String(value.getMonth() + 1).padStart(2, "0");
        const day = String(value.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      }

      return typeof value === "string" ? value.trim() : value;
    },
    z.union([
      z
        .string()
        .regex(
          DATE_ONLY_REGEX,
          "fechadiagnostico debe usar el formato YYYY-MM-DD",
        ),
      z.null(),
    ]),
  )
  .transform((value) => (value === null ? null : toLocalDateOnly(value)))
  .optional();

/**
 * Esquema Zod para validar la creación de alergia.
 */
export const createAlergiaSchema = z.object({
  pacienteId: z.number().int(),
  tipo: z.string(),
  desencadenante: z.string().nullable().optional(),
  severidad: z.string().nullable().optional(),
  reaccion: z.string().nullable().optional(),
  tratamiento: z.string().nullable().optional(),
  fechadiagnostico: dateOnlyField,
  estado: z.string().optional(),
  observaciones: z.string().nullable().optional(),
  creadopor: z.string().nullable().optional(),
  creadoen: z.coerce.date().optional(),
  modificadopor: z.string().nullable().optional(),
  modificadoen: z.coerce.date().nullable().optional(),
  campoprueba01: z.string().nullable().optional(),
  campoprueba02: z.string().nullable().optional(),
  campoprueba03: z.string().nullable().optional(),
  campoprueba04: z.string().nullable().optional(),
  campoprueba05: z.string().nullable().optional(),
});
/**
 * DTO de entrada para crear alergia.
 */
export class CreateAlergiaDto extends createZodDto(createAlergiaSchema) {}

/**
 * Esquema Zod para validar la actualización de alergia.
 */
export const updateAlergiaSchema = z
  .object({
    pacienteId: z.number().int(),
    tipo: z.string(),
    desencadenante: z.string().nullable().optional(),
    severidad: z.string().nullable().optional(),
    reaccion: z.string().nullable().optional(),
    tratamiento: z.string().nullable().optional(),
    fechadiagnostico: dateOnlyField,
    estado: z.string().optional(),
    observaciones: z.string().nullable().optional(),
    creadopor: z.string().nullable().optional(),
    creadoen: z.coerce.date().optional(),
    modificadopor: z.string().nullable().optional(),
    modificadoen: z.coerce.date().nullable().optional(),
    campoprueba01: z.string().nullable().optional(),
    campoprueba02: z.string().nullable().optional(),
    campoprueba03: z.string().nullable().optional(),
    campoprueba04: z.string().nullable().optional(),
    campoprueba05: z.string().nullable().optional(),
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "debes enviar al menos un campo",
  });
/**
 * DTO de entrada para actualizar alergia.
 */
export class UpdateAlergiaDto extends createZodDto(updateAlergiaSchema) {}
