import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as chrono from "chrono-node";
import { NotificacionService } from "../modules/notificacion/notificacion.service";
import { ScheduleNotificationDto } from "./dto/schedule-notification.dto";
import { ParseScheduleDto } from "./dto/parse-schedule.dto";
import { CreateNotificacionDto } from "../modules/notificacion/dto/create-notificacion.dto";

/**
 * Implementa la lógica de negocio y persistencia del dominio notifications.
 */
@Injectable()
export class NotificationsService {
  private readonly defaultTimeZone: string;

  constructor(
    private readonly notificacionService: NotificacionService,
    private readonly configService: ConfigService,
  ) {
    this.defaultTimeZone =
      this.configService.get<string>("NOTIFICATIONS_DEFAULT_TZ") ?? "UTC";
  }

  /**
   * Preview schedule.
   * @param payload Datos validados que recibe la operación.
   * @returns Resultado de la consulta solicitada.
   */
  previewSchedule(payload: ParseScheduleDto) {
    const timezoneToUse = payload.timezone ?? this.defaultTimeZone;
    const fechaprogramada = this.parseSchedule(
      payload.scheduleText,
      payload.referenceDate,
      timezoneToUse,
    );
    return {
      scheduleText: payload.scheduleText,
      timezone: timezoneToUse,
      fechaprogramada: fechaprogramada.toISOString(),
    };
  }

  /**
   * Schedule from natural language.
   * @param payload Datos validados que recibe la operación.
   * @returns Resultado de la operación.
   */
  async scheduleFromNaturalLanguage(payload: ScheduleNotificationDto) {
    const timezoneToUse = payload.timezone ?? this.defaultTimeZone;
    const fechaprogramada = this.parseSchedule(
      payload.scheduleText,
      payload.referenceDate,
      timezoneToUse,
    );

    const { scheduleText, timezone, referenceDate, ...baseNotification } =
      payload;

    const entityPayload: CreateNotificacionDto = {
      ...(baseNotification as Omit<CreateNotificacionDto, "fechaprogramada">),
      fechaprogramada,
      campoprueba01: baseNotification.campoprueba01 ?? scheduleText,
      campoprueba02: baseNotification.campoprueba02 ?? timezoneToUse,
    };

    return this.notificacionService.create(entityPayload);
  }

  /**
   * Interpreta schedule.
   * @param scheduleText Texto en lenguaje natural con la fecha u hora deseada.
   * @param referenceDate Fecha base desde la cual se interpreta el texto.
   * @param timezone Zona horaria que se utilizará en la operación.
   * @returns Valor interpretado a partir de la entrada recibida.
   */
  private parseSchedule(
    scheduleText: string,
    referenceDate?: Date,
    timezone?: string,
  ): Date {
    const ref = referenceDate ?? new Date();
    const results = chrono.parse(scheduleText, ref, { forwardDate: true });
    if (!results.length || !results[0].start) {
      throw new BadRequestException(
        "no pude interpretar la fecha/hora que enviaste",
      );
    }
    let parsedDate = results[0].start.date();
    if (timezone) {
      parsedDate = this.shiftDateToTimeZone(parsedDate, timezone);
    }
    return parsedDate;
  }

  /**
   * Shift date to time zone.
   * @param date Fecha de referencia para la operación.
   * @param timeZone Zona horaria que se utilizará en la operación.
   * @returns Resultado de la operación.
   */
  private shiftDateToTimeZone(date: Date, timeZone: string): Date {
    const targetOffset = this.getTimeZoneOffset(date, timeZone);
    const currentOffset = date.getTimezoneOffset();
    const diffMinutes = targetOffset - currentOffset;
    return new Date(date.getTime() + diffMinutes * 60 * 1000);
  }

  /**
   * Obtiene time zone offset.
   * @param date Fecha de referencia para la operación.
   * @param timeZone Zona horaria que se utilizará en la operación.
   * @returns Resultado de la consulta solicitada.
   */
  private getTimeZoneOffset(date: Date, timeZone: string): number {
    try {
      return this.extractOffset(date, timeZone, "shortOffset");
    } catch (error) {
      return this.extractOffset(date, timeZone, "short");
    }
  }

  /**
   * Extract offset.
   * @param date Fecha de referencia para la operación.
   * @param timeZone Zona horaria que se utilizará en la operación.
   * @param style Valor del parámetro `style`.
   * @returns Resultado de la operación.
   */
  private extractOffset(
    date: Date,
    timeZone: string,
    style: "short" | "shortOffset",
  ): number {
    let parts: Intl.DateTimeFormatPart[];
    try {
      parts = new Intl.DateTimeFormat("en-US", {
        timeZone,
        timeZoneName: style,
        hour12: false,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).formatToParts(date);
    } catch (error) {
      throw new BadRequestException(`zona horaria desconocida: ${timeZone}`);
    }

    const tzName =
      parts.find((part) => part.type === "timeZoneName")?.value ?? "UTC";
    const match = tzName.match(/GMT([+-]\d{1,2})(?::(\d{2}))?/);
    if (!match) {
      if (tzName.toUpperCase() === "UTC") {
        return 0;
      }
      throw new BadRequestException(
        `no pude obtener el offset para ${timeZone}`,
      );
    }
    const hours = Number(match[1]);
    const minutes = match[2] ? Number(match[2]) : 0;
    const sign = hours >= 0 ? 1 : -1;
    const totalMinutes = Math.abs(hours) * 60 + minutes;
    return -sign * totalMinutes;
  }
}
