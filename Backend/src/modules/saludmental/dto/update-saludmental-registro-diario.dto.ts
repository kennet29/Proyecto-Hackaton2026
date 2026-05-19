import { createZodDto } from "nestjs-zod";
import { z } from "zod";

const scoreSchema = z.number().int().min(1).max(5);

/**
 * Esquema Zod para validar la actualización de saludmental registro diario.
 */
export const updateSaludmentalRegistroDiarioSchema = z
  .object({
    fecha: z.coerce.date().optional(),
    estadoAnimo: scoreSchema.optional(),
    estres: scoreSchema.optional(),
    ansiedad: scoreSchema.optional(),
    horasSueno: z.number().min(0).max(24).optional(),
    notaPersonal: z.string().trim().max(2500).optional(),
    modificadoPor: z.string().trim().max(60).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "debes enviar al menos un campo",
  });

/**
 * DTO de entrada para actualizar saludmental registro diario.
 */
export class UpdateSaludmentalRegistroDiarioDto extends createZodDto(
  updateSaludmentalRegistroDiarioSchema,
) {}
