import { createZodDto } from "nestjs-zod";
import { z } from "zod";

/**
 * Valor reutilizable asociado a temporal durations.
 */
export const temporalDurations = ["15m", "1h", "1d"] as const;

/**
 * Esquema Zod para validar la creación de permiso acceso.
 */
export const createPermisoAccesoSchema = z
  .object({
    medicoId: z.number().int().positive(),
    tipo: z.enum(["temporal", "permanente"]),
    duracion: z.enum(temporalDurations).optional(),
    notas: z.string().max(200).optional(),
  })
  .refine(
    (value) =>
      (value.tipo === "temporal" && value.duracion) ||
      value.tipo === "permanente",
    {
      message: "debes indicar una duracion para permisos temporales",
      path: ["duracion"],
    },
  )
  .refine((value) => !(value.tipo === "permanente" && value.duracion), {
    message: "no debes indicar duracion para permisos permanentes",
    path: ["duracion"],
  });

/**
 * DTO de entrada para crear permiso acceso.
 */
export class CreatePermisoAccesoDto extends createZodDto(
  createPermisoAccesoSchema,
) {}
