import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { createNotificacionSchema } from '../../modules/notificacion/dto/create-notificacion.dto';

export const scheduleNotificationSchema = createNotificacionSchema
  .omit({ fechaprogramada: true })
  .extend({
    scheduleText: z.string().min(3, 'describe el momento de envío'),
    timezone: z.string().min(2).optional(),
    referenceDate: z.coerce.date().optional(),
  });

export class ScheduleNotificationDto extends createZodDto(scheduleNotificationSchema) {}
