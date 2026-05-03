import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const nullableString = z.string().nullable().optional();

export const medicoRegistroEstados = ['pendiente', 'aprobado', 'rechazado'] as const;

export const createMedicoregistroSchema = z.object({
  usuarioId: z.number().int().positive(),
  hospitaltrabajo: z.string().min(1).max(150),
  titulo: z.string().min(1).max(150),
  codigominsa: nullableString,
  numerolicencia: z.string().min(1).max(80),
  entidadcertificadora: nullableString,
  especialidadprincipal: nullableString,
  documentorespaldo: nullableString,
  fotocodigominsaBase64: nullableString,
  fototituloBase64: nullableString,
  observaciones: z.string().max(400).nullable().optional(),
  creadopor: nullableString,
  creadoen: z.coerce.date().optional(),
  modificadopor: nullableString,
  modificadoen: z.coerce.date().nullable().optional(),
});
export class CreateMedicoregistroDto extends createZodDto(createMedicoregistroSchema) {}

export const updateMedicoregistroSchema = z
  .object({
    usuarioId: z.number().int().positive().optional(),
    hospitaltrabajo: z.string().min(1).max(150).optional(),
    titulo: z.string().min(1).max(150).optional(),
    codigominsa: nullableString,
    numerolicencia: z.string().min(1).max(80).optional(),
    entidadcertificadora: nullableString,
    especialidadprincipal: nullableString,
    documentorespaldo: nullableString,
    fotocodigominsaBase64: nullableString,
    fototituloBase64: nullableString,
    estado: z.enum(medicoRegistroEstados).optional(),
    fechasolicitud: z.coerce.date().optional(),
    fecharevision: z.coerce.date().nullable().optional(),
    observaciones: z.string().max(400).nullable().optional(),
    creadopor: nullableString,
    creadoen: z.coerce.date().optional(),
    modificadopor: nullableString,
    modificadoen: z.coerce.date().nullable().optional(),
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, { message: 'debes enviar al menos un campo' });
export class UpdateMedicoregistroDto extends createZodDto(updateMedicoregistroSchema) {}
