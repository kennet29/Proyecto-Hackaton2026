import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const nullableText = z.string().trim().max(500).nullable().optional();

export const institucionSaludTipos = ['clinica', 'hospital', 'laboratorio'] as const;

export const createInstitucionsaludSchema = z.object({
  nombre: z.string().trim().min(1).max(160),
  tipo: z.enum(institucionSaludTipos),
  descripcion: nullableText,
  telefono: z.string().trim().max(40).nullable().optional(),
  correo: z.string().trim().email().max(120).nullable().optional(),
  sitioWeb: z.string().trim().url().max(200).nullable().optional(),
  direccion: z.string().trim().max(250).nullable().optional(),
  ciudad: z.string().trim().max(120).nullable().optional(),
  departamento: z.string().trim().max(120).nullable().optional(),
  horarioAtencion: z.string().trim().max(200).nullable().optional(),
  latitud: z.number().min(-90).max(90).nullable().optional(),
  longitud: z.number().min(-180).max(180).nullable().optional(),
  logoBase64: z.string().trim().nullable().optional(),
  logoMimeType: z.string().trim().max(120).nullable().optional(),
  logoNombreArchivo: z.string().trim().max(180).nullable().optional(),
  activo: z.boolean().optional(),
  creadoPor: z.string().trim().max(60).nullable().optional(),
  creadoEn: z.coerce.date().optional(),
  modificadoPor: z.string().trim().max(60).nullable().optional(),
  modificadoEn: z.coerce.date().nullable().optional(),
});

export class CreateInstitucionsaludDto extends createZodDto(createInstitucionsaludSchema) {}
