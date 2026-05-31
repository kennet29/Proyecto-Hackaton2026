import { Body, Controller, Post } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { ScheduleNotificationDto } from "./dto/schedule-notification.dto";
import { ParseScheduleDto } from "./dto/parse-schedule.dto";

/**
 * Expone los endpoints HTTP del dominio notifications.
 */
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Schedule from natural language.
   * @param payload Datos validados que recibe la operación.
   * @returns Resultado de la operación.
   */
  @Post("natural")
  scheduleFromNaturalLanguage(@Body() payload: ScheduleNotificationDto) {
    return this.notificationsService.scheduleFromNaturalLanguage(payload);
  }

  /**
   * Preview schedule.
   * @param payload Datos validados que recibe la operación.
   * @returns Resultado de la consulta solicitada.
   */
  @Post("parse")
  previewSchedule(@Body() payload: ParseScheduleDto) {
    return this.notificationsService.previewSchedule(payload);
  }
}
