import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createDetalleevaluacionsaludSchema = z.object({
  evaluacionId: z.number().int(),
  habitoId: z.number().int().nullable().optional(),
  componente: z.string().nullable().optional(),
  peso: z.number().nullable().optional(),
  comentario: z.string().nullable().optional(),
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
export class CreateDetalleevaluacionsaludDto extends createZodDto(createDetalleevaluacionsaludSchema) {}

export const updateDetalleevaluacionsaludSchema = z.object({
  evaluacionId: z.number().int(),
  habitoId: z.number().int().nullable().optional(),
  componente: z.string().nullable().optional(),
  peso: z.number().nullable().optional(),
  comentario: z.string().nullable().optional(),
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
export class UpdateDetalleevaluacionsaludDto extends createZodDto(updateDetalleevaluacionsaludSchema) {}

