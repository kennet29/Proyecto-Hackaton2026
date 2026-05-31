import { createZodDto } from "nestjs-zod";
import { z } from "zod";

/**
 * Esquema Zod utilizado por parse schedule.
 */
export const parseScheduleSchema = z.object({
  scheduleText: z.string().min(3, "describe cuando enviar la notificaci�n"),
  timezone: z.string().min(2).optional(),
  referenceDate: z.coerce.date().optional(),
});

/**
 * DTO usado por el flujo parse schedule.
 */
export class ParseScheduleDto extends createZodDto(parseScheduleSchema) {}
