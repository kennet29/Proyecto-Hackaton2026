import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createPermisoAccesoQrSchema = z.object({
  duracionMinutos: z.number().int().min(1).max(60).default(5),
});

export class CreatePermisoAccesoQrDto extends createZodDto(createPermisoAccesoQrSchema) {}
