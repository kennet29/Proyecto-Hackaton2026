import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const requestResetSchema = z.object({
  username: z.string().min(3).max(60),
});

export class RequestResetDto extends createZodDto(requestResetSchema) {}
