import { Body, Controller, Post, Req } from "@nestjs/common";
import { Request } from "express";
import { NotificationsService } from "./notifications.service";
import { ScheduleNotificationDto } from "./dto/schedule-notification.dto";
import { ParseScheduleDto } from "./dto/parse-schedule.dto";
import { RegisterPushDeviceDto } from "./dto/register-push-device.dto";
import { PushNotificationsService } from "./push-notifications.service";
import { AuthenticatedUser } from "../auth/auth.service";

/**
 * Expone los endpoints HTTP del dominio notifications.
 */
@Controller("notifications")
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly pushNotificationsService: PushNotificationsService,
  ) {}

  @Post("device")
  registerDevice(@Body() payload: RegisterPushDeviceDto, @Req() req: Request) {
    return this.pushNotificationsService.registerDevice(
      (req.user as AuthenticatedUser).userId,
      payload.expoPushToken,
      payload.platform,
    );
  }

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
