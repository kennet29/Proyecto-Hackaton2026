import { createZodDto } from 'nestjs-zod';
import { createSeguimientofisicoSchema } from './create-seguimientofisico.dto';

export const updateSeguimientofisicoSchema = createSeguimientofisicoSchema
  .omit({ pacienteId: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'debes enviar al menos un campo',
  });

export class UpdateSeguimientofisicoDto extends createZodDto(
  updateSeguimientofisicoSchema,
) {}
