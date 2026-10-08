import { createZodDto } from "nestjs-zod";
import { z } from "zod";

const wallClockDateTimePattern =
  /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,7}))?)?(?:Z|[+-]\d{2}:?\d{2})?$/;

/**
 * Convierte una fecha/hora de agenda sin desplazar sus componentes por la
 * zona horaria del proceso. `datetime2` no guarda zona horaria, por lo que la
 * hora escrita por el usuario debe conservarse como un valor de reloj local.
 */
export const wallClockDateTimeSchema = z.union([z.date(), z.string()]).transform(
  (value, ctx) => {
    if (value instanceof Date) return value;

    const match = value.match(wallClockDateTimePattern);
    if (!match) {
      ctx.addIssue({
        code: "custom",
        message: "fechacita debe usar el formato YYYY-MM-DDTHH:mm",
      });
      return z.NEVER;
    }

    const [, year, month, day, hour, minute, second = "0", fraction = ""] = match;
    const milliseconds = Number(fraction.padEnd(3, "0").slice(0, 3));
    const parsed = new Date(
      Date.UTC(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        Number(second),
        milliseconds,
      ),
    );

    if (
      parsed.getUTCFullYear() !== Number(year) ||
      parsed.getUTCMonth() !== Number(month) - 1 ||
      parsed.getUTCDate() !== Number(day) ||
      parsed.getUTCHours() !== Number(hour) ||
      parsed.getUTCMinutes() !== Number(minute) ||
      parsed.getUTCSeconds() !== Number(second)
    ) {
      ctx.addIssue({ code: "custom", message: "fechacita no es valida" });
      return z.NEVER;
    }

    return parsed;
  },
);

/**
 * Esquema Zod para validar la creación de citamedica.
 */
export const createCitamedicaSchema = z.object({
  pacienteId: z.number().int(),
  especialidadId: z.number().int().nullable().optional(),
  fechacita: wallClockDateTimeSchema,
  especialidad: z.string().nullable().optional(),
  motivo: z.string().nullable().optional(),
  medico: z.string().nullable().optional(),
  estado: z.string().optional(),
  notas: z.string().nullable().optional(),
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
 * DTO de entrada para crear citamedica.
 */
export class CreateCitamedicaDto extends createZodDto(createCitamedicaSchema) {}

/**
 * Esquema Zod para validar la actualización de citamedica.
 */
export const updateCitamedicaSchema = z
  .object({
    pacienteId: z.number().int(),
    especialidadId: z.number().int().nullable().optional(),
    fechacita: wallClockDateTimeSchema,
    especialidad: z.string().nullable().optional(),
    motivo: z.string().nullable().optional(),
    medico: z.string().nullable().optional(),
    estado: z.string().optional(),
    notas: z.string().nullable().optional(),
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
 * DTO de entrada para actualizar citamedica.
 */
export class UpdateCitamedicaDto extends createZodDto(updateCitamedicaSchema) {}
