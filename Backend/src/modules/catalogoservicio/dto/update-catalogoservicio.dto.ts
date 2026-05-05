import { createZodDto } from 'nestjs-zod';
import { createCatalogoservicioSchema } from './create-catalogoservicio.dto';

export const updateCatalogoservicioSchema = createCatalogoservicioSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'debes enviar al menos un campo',
  });

export class UpdateCatalogoservicioDto extends createZodDto(updateCatalogoservicioSchema) {}
