import { createZodDto } from 'nestjs-zod';
import { createInstitucionservicioSchema } from './create-institucionservicio.dto';

export const updateInstitucionservicioSchema = createInstitucionservicioSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'debes enviar al menos un campo',
  });

export class UpdateInstitucionservicioDto extends createZodDto(updateInstitucionservicioSchema) {}
