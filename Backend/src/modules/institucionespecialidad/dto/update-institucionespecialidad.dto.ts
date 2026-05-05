import { createZodDto } from 'nestjs-zod';
import { createInstitucionespecialidadSchema } from './create-institucionespecialidad.dto';

export const updateInstitucionespecialidadSchema = createInstitucionespecialidadSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'debes enviar al menos un campo',
  });

export class UpdateInstitucionespecialidadDto extends createZodDto(
  updateInstitucionespecialidadSchema,
) {}
