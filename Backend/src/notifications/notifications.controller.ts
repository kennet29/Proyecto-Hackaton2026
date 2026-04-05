import { Body, Controller, Post } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { ScheduleNotificationDto } from './dto/schedule-notification.dto';
import { ParseScheduleDto } from './dto/parse-schedule.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('natural')
  scheduleFromNaturalLanguage(@Body() payload: ScheduleNotificationDto) {
    return this.notificationsService.scheduleFromNaturalLanguage(payload);
  }

  @Post('parse')
  previewSchedule(@Body() payload: ParseScheduleDto) {
    return this.notificationsService.previewSchedule(payload);
  }
}
