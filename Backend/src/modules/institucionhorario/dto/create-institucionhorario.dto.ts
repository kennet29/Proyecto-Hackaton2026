import { createZodDto } from "nestjs-zod";
import { z } from "zod";

const timeSchema = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "hora invalida");

/**
 * Valor reutilizable asociado a institucionhorario fields.
 */
export const institucionhorarioFields = {
  institucionSaludId: z.number().int().positive(),
  diaSemana: z.number().int().min(1).max(7),
  horaInicio: timeSchema.nullable().optional(),
  horaFin: timeSchema.nullable().optional(),
  cerrado: z.boolean().optional(),
  veinticuatroHoras: z.boolean().optional(),
  observaciones: z.string().trim().max(200).nullable().optional(),
  activo: z.boolean().optional(),
  creadoPor: z.string().trim().max(60).nullable().optional(),
  creadoEn: z.coerce.date().optional(),
  modificadoPor: z.string().trim().max(60).nullable().optional(),
  modificadoEn: z.coerce.date().nullable().optional(),
} satisfies z.ZodRawShape;

/**
 * Esquema Zod utilizado por institucionhorario fields.
 */
export const institucionhorarioFieldsSchema = z.object(
  institucionhorarioFields,
);

/**
 * Esquema Zod para validar la creación de institucionhorario.
 */
export const createInstitucionhorarioSchema = z
  .object(institucionhorarioFields)
  .superRefine((value, ctx) => {
    const cerrado = value.cerrado ?? false;
    const veinticuatroHoras = value.veinticuatroHoras ?? false;
    if (
      !cerrado &&
      !veinticuatroHoras &&
      (!value.horaInicio || !value.horaFin)
    ) {
      ctx.addIssue({
        code: "custom",
        message:
          "horaInicio y horaFin son obligatorias si no esta cerrado ni es 24 horas",
        path: ["horaInicio"],
      });
    }
  });

/**
 * DTO de entrada para crear institucionhorario.
 */
export class CreateInstitucionhorarioDto extends createZodDto(
  createInstitucionhorarioSchema,
) {}
