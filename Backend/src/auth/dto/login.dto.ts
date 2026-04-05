import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { fingerprintTemplateSchema } from '../../common/schemas/fingerprint.schema';

export const loginSchema = z
  .object({
    username: z.string().min(3).max(60),
    password: z.string().min(6).max(128).optional(),
    fingerprintTemplate: fingerprintTemplateSchema.optional(),
  })
  .refine(
    (value) => Boolean(value.password) !== Boolean(value.fingerprintTemplate),
    {
      message: 'debes enviar contraseña o huella digital',
      path: ['password'],
    },
  );

export class LoginDto extends createZodDto(loginSchema) {}
