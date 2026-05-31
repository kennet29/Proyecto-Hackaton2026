import { createZodDto } from "nestjs-zod";
import { createCatalogoservicioSchema } from "./create-catalogoservicio.dto";

/**
 * Esquema Zod para validar la actualización de catalogoservicio.
 */
export const updateCatalogoservicioSchema = createCatalogoservicioSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "debes enviar al menos un campo",
  });

/**
 * DTO de entrada para actualizar catalogoservicio.
 */
export class UpdateCatalogoservicioDto extends createZodDto(
  updateCatalogoservicioSchema,
) {}
