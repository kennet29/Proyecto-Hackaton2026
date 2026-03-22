import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createRolpermisoSchema = z.object({
  rolId: z.number().int(),
  permisoId: z.number().int(),
  creadopor: z.string().nullable().optional(),
  creadoen: z.coerce.date().optional(),
  campoprueba01: z.string().nullable().optional(),
  campoprueba02: z.string().nullable().optional(),
  campoprueba03: z.string().nullable().optional(),
  campoprueba04: z.string().nullable().optional(),
  campoprueba05: z.string().nullable().optional(),
});
export class CreateRolpermisoDto extends createZodDto(createRolpermisoSchema) {}

export const updateRolpermisoSchema = z.object({
  rolId: z.number().int(),
  permisoId: z.number().int(),
  creadopor: z.string().nullable().optional(),
  creadoen: z.coerce.date().optional(),
  campoprueba01: z.string().nullable().optional(),
  campoprueba02: z.string().nullable().optional(),
  campoprueba03: z.string().nullable().optional(),
  campoprueba04: z.string().nullable().optional(),
  campoprueba05: z.string().nullable().optional(),
}).partial().refine((value) => Object.keys(value).length > 0, { message: 'debes enviar al menos un campo' });
export class UpdateRolpermisoDto extends createZodDto(updateRolpermisoSchema) {}

