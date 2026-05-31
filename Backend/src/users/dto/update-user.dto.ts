import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { createUserSchema } from "./create-user.dto";

/**
 * Esquema Zod para validar la actualización de user.
 */
export const updateUserSchema = createUserSchema
  .partial()
  .extend({
    lastLogin: z.coerce.date().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "debes enviar al menos un campo para actualizar",
  });

/**
 * DTO de entrada para actualizar user.
 */
export class UpdateUserDto extends createZodDto(updateUserSchema) {}
