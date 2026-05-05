import { createZodDto } from 'nestjs-zod';
import { institucionhorarioFieldsSchema } from './create-institucionhorario.dto';

export const updateInstitucionhorarioSchema = institucionhorarioFieldsSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'debes enviar al menos un campo',
  });

export class UpdateInstitucionhorarioDto extends createZodDto(updateInstitucionhorarioSchema) {}
