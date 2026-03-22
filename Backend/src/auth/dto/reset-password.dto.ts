import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const resetPasswordSchema = z.object({
  token: z.string().min(10).max(100),
  password: z.string().min(6).max(128),
});

export class ResetPasswordDto extends createZodDto(resetPasswordSchema) {}
