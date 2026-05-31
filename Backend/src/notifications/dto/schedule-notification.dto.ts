import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { createNotificacionSchema } from "../../modules/notificacion/dto/create-notificacion.dto";

/**
 * Esquema Zod utilizado por schedule notification.
 */
export const scheduleNotificationSchema = createNotificacionSchema
  .omit({ fechaprogramada: true })
  .extend({
    scheduleText: z.string().min(3, "describe el momento de env�o"),
    timezone: z.string().min(2).optional(),
    referenceDate: z.coerce.date().optional(),
  });

/**
 * DTO usado por el flujo schedule notification.
 */
export class ScheduleNotificationDto extends createZodDto(
  scheduleNotificationSchema,
) {}
