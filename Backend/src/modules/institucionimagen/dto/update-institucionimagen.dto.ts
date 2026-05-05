import { createZodDto } from 'nestjs-zod';
import { createInstitucionimagenSchema } from './create-institucionimagen.dto';

export const updateInstitucionimagenSchema = createInstitucionimagenSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'debes enviar al menos un campo',
  });

export class UpdateInstitucionimagenDto extends createZodDto(updateInstitucionimagenSchema) {}
