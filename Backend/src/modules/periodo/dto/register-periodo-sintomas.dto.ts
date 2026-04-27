import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const registerPeriodoSintomasSchema = z
  .object({
    dolor: z.enum(['sin_dolor', 'leve', 'moderado', 'intenso']).optional(),
    flujo: z.enum(['leve', 'moderado', 'abundante']).optional(),
    sintomas: z.array(z.string().trim().min(1)).max(30).optional(),
    observaciones: z.string().trim().max(2000).optional(),
    modificadoPor: z.string().trim().max(60).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'debes enviar al menos un campo',
  });

export class RegisterPeriodoSintomasDto extends createZodDto(
  registerPeriodoSintomasSchema,
) {}
