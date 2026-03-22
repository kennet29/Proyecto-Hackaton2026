import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createControlprenatalSchema = z.object({
  embarazoId: z.number().int(),
  fechacontrol: z.coerce.date(),
  semanagestacion: z.number().int().nullable().optional(),
  presionarterial: z.string().nullable().optional(),
  peso: z.number().nullable().optional(),
  fetalheartrate: z.number().int().nullable().optional(),
  intervenciones: z.string().nullable().optional(),
  creadopor: z.string().nullable().optional(),
  creadoen: z.coerce.date().optional(),
  modificadopor: z.string().nullable().optional(),
  modificadoen: z.coerce.date().nullable().optional(),
  campoprueba01: z.string().nullable().optional(),
  campoprueba02: z.string().nullable().optional(),
  campoprueba03: z.string().nullable().optional(),
  campoprueba04: z.string().nullable().optional(),
  campoprueba05: z.string().nullable().optional(),
});
export class CreateControlprenatalDto extends createZodDto(createControlprenatalSchema) {}

export const updateControlprenatalSchema = z.object({
  embarazoId: z.number().int(),
  fechacontrol: z.coerce.date(),
  semanagestacion: z.number().int().nullable().optional(),
  presionarterial: z.string().nullable().optional(),
  peso: z.number().nullable().optional(),
  fetalheartrate: z.number().int().nullable().optional(),
  intervenciones: z.string().nullable().optional(),
  creadopor: z.string().nullable().optional(),
  creadoen: z.coerce.date().optional(),
  modificadopor: z.string().nullable().optional(),
  modificadoen: z.coerce.date().nullable().optional(),
  campoprueba01: z.string().nullable().optional(),
  campoprueba02: z.string().nullable().optional(),
  campoprueba03: z.string().nullable().optional(),
  campoprueba04: z.string().nullable().optional(),
  campoprueba05: z.string().nullable().optional(),
}).partial().refine((value) => Object.keys(value).length > 0, { message: 'debes enviar al menos un campo' });
export class UpdateControlprenatalDto extends createZodDto(updateControlprenatalSchema) {}

