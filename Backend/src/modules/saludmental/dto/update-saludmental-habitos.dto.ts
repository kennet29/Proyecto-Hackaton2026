import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const updateSaludmentalHabitosSchema = z
  .object({
    ejercicioMinutos: z.number().int().min(0).max(1440).optional(),
    hidratacionLitros: z.number().min(0).max(20).optional(),
    descansoHoras: z.number().min(0).max(24).optional(),
    tiempoSocialMinutos: z.number().int().min(0).max(1440).optional(),
    pausasDigitales: z.number().int().min(0).max(100).optional(),
    modificadoPor: z.string().trim().max(60).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'debes enviar al menos un campo',
  });

export class UpdateSaludmentalHabitosDto extends createZodDto(
  updateSaludmentalHabitosSchema,
) {}
