import { createZodDto } from 'nestjs-zod';
import { createInstitucionmedicamentoSchema } from './create-institucionmedicamento.dto';

export const updateInstitucionmedicamentoSchema = createInstitucionmedicamentoSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'debes enviar al menos un campo',
  });

export class UpdateInstitucionmedicamentoDto extends createZodDto(
  updateInstitucionmedicamentoSchema,
) {}
