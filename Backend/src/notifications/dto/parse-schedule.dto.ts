import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const parseScheduleSchema = z.object({
  scheduleText: z.string().min(3, 'describe cuando enviar la notificación'),
  timezone: z.string().min(2).optional(),
  referenceDate: z.coerce.date().optional(),
});

export class ParseScheduleDto extends createZodDto(parseScheduleSchema) {}
