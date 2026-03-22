import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createDocumentoclinicoSchema = z.object({
  pacienteId: z.number().int(),
  tipodocumentoId: z.number().int(),
  entidadorigen: z.string(),
  entidadId: z.number().int().nullable().optional(),
  rutaarchivo: z.string().nullable().optional(),
  urlexterna: z.string().nullable().optional(),
  fechadocumento: z.coerce.date().nullable().optional(),
  notas: z.string().nullable().optional(),
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
export class CreateDocumentoclinicoDto extends createZodDto(createDocumentoclinicoSchema) {}

export const updateDocumentoclinicoSchema = z.object({
  pacienteId: z.number().int(),
  tipodocumentoId: z.number().int(),
  entidadorigen: z.string(),
  entidadId: z.number().int().nullable().optional(),
  rutaarchivo: z.string().nullable().optional(),
  urlexterna: z.string().nullable().optional(),
  fechadocumento: z.coerce.date().nullable().optional(),
  notas: z.string().nullable().optional(),
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
export class UpdateDocumentoclinicoDto extends createZodDto(updateDocumentoclinicoSchema) {}

