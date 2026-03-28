import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const claimPermisoAccesoQrSchema = z.object({
  token: z.string().min(10).max(128),
});

export class ClaimPermisoAccesoQrDto extends createZodDto(claimPermisoAccesoQrSchema) {}
