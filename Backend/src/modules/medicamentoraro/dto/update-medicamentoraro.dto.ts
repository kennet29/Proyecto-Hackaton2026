import { createZodDto } from 'nestjs-zod';
import { createMedicamentoraroSchema } from './create-medicamentoraro.dto';

export const updateMedicamentoraroSchema = createMedicamentoraroSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'debes enviar al menos un campo',
  });

export class UpdateMedicamentoraroDto extends createZodDto(updateMedicamentoraroSchema) {}
