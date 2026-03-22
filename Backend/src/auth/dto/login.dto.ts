import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(3).max(60),
  password: z.string().min(6).max(128),
});

export class LoginDto extends createZodDto(loginSchema) {}
