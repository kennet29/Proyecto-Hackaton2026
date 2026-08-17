import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const crearPagoPremiumSchema = z.object({ banco: z.enum(["banpro", "bac", "lafise"]), plan: z.enum(["mensual", "trimestral"]), comprobanteBase64: z.string().min(20), nombreComprobante: z.string().min(1).max(260), mimeComprobante: z.enum(["application/pdf", "image/jpeg", "image/png"]) });
export class CrearPagoPremiumDto extends createZodDto(crearPagoPremiumSchema) {}

export const revisarPagoPremiumSchema = z.object({ estado: z.enum(["aprobado", "rechazado"]), observaciones: z.string().max(400).nullable().optional() });
export class RevisarPagoPremiumDto extends createZodDto(revisarPagoPremiumSchema) {}
