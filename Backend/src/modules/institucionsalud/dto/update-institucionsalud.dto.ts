import { createZodDto } from 'nestjs-zod';
import { createInstitucionsaludSchema } from './create-institucionsalud.dto';

export const updateInstitucionsaludSchema = createInstitucionsaludSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'debes enviar al menos un campo',
  });

export class UpdateInstitucionsaludDto extends createZodDto(updateInstitucionsaludSchema) {}
