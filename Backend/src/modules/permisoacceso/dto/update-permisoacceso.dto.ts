import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { temporalDurations } from './create-permisoacceso.dto';

export const updatePermisoAccesoSchema = z.object({
  tipo: z.enum(['temporal', 'permanente']).optional(),
  duracion: z.enum(temporalDurations).nullable().optional(),
  notas: z.string().max(200).nullable().optional(),
  estado: z.enum(['activo', 'revocado']).optional(),
});

export class UpdatePermisoAccesoDto extends createZodDto(updatePermisoAccesoSchema) {}
