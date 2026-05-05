import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createCatalogoservicioSchema = z.object({
  codigo: z.string().trim().max(40).nullable().optional(),
  nombre: z.string().trim().min(1).max(150),
  categoria: z.string().trim().max(80).nullable().optional(),
  descripcion: z.string().trim().max(500).nullable().optional(),
  requierePreparacion: z.boolean().optional(),
  requiereReferencia: z.boolean().optional(),
  activo: z.boolean().optional(),
  creadoPor: z.string().trim().max(60).nullable().optional(),
  creadoEn: z.coerce.date().optional(),
  modificadoPor: z.string().trim().max(60).nullable().optional(),
  modificadoEn: z.coerce.date().nullable().optional(),
});

export class CreateCatalogoservicioDto extends createZodDto(createCatalogoservicioSchema) {}
