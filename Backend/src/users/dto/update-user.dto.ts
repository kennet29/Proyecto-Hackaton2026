import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { createUserSchema } from './create-user.dto';

export const updateUserSchema = createUserSchema
  .partial()
  .extend({
    lastLogin: z.coerce.date().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'debes enviar al menos un campo para actualizar',
  });

export class UpdateUserDto extends createZodDto(updateUserSchema) {}
