import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Notificacion } from "../modules/notificacion/notificacion.entity";
import { UsuarioPaciente } from "../modules/usuariopaciente/usuariopaciente.entity";
import { Usuario } from "../users/entities/user.entity";
import { PushDevice } from "./push-device.entity";

type ExpoTicket = { status?: string; details?: { error?: string } };

@Injectable()
export class PushNotificationsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PushNotificationsService.name);
  private readonly enabled: boolean;
  private timer?: NodeJS.Timeout;
  private syncing = false;

  constructor(
    @InjectRepository(PushDevice) private readonly devices: Repository<PushDevice>,
    @InjectRepository(Notificacion) private readonly notifications: Repository<Notificacion>,
    @InjectRepository(UsuarioPaciente) private readonly userPatients: Repository<UsuarioPaciente>,
    @InjectRepository(Usuario) private readonly users: Repository<Usuario>,
    config: ConfigService,
  ) {
    this.enabled = config.get<string>("PUSH_NOTIFICATIONS_ENABLED", "true").toLowerCase() !== "false";
  }

  onModuleInit() {
    if (!this.enabled) return;
    void this.deliverDueNotifications();
    this.timer = setInterval(() => void this.deliverDueNotifications(), 60_000);
  }

  onModuleDestroy() { if (this.timer) clearInterval(this.timer); }

  async registerDevice(usuarioId: number, expoPushToken: string, platform: string) {
    const existing = await this.devices.findOne({ where: { expoPushToken } });
    const device = existing
      ? Object.assign(existing, { usuarioId, platform, active: true })
      : this.devices.create({ usuarioId, expoPushToken, platform, active: true });
    const saved = await this.devices.save(device);
    return { id: saved.id, registered: true };
  }

  private async deliverDueNotifications() {
    if (this.syncing) return;
    this.syncing = true;
    try {
      const due = await this.notifications.createQueryBuilder("notification")
        .where("notification.enviada = :sent", { sent: false })
        .andWhere("notification.fechaprogramada <= SYSDATETIME()")
        .take(100).getMany();
      for (const notification of due) {
        if (await this.sendForPatient(notification)) {
          notification.enviada = true;
          await this.notifications.save(notification);
        }
      }
    } catch (error) {
      this.logger.error("No se pudieron procesar las notificaciones pendientes", error as Error);
    } finally { this.syncing = false; }
  }

  private async sendForPatient(notification: Notificacion): Promise<boolean> {
    const [relations, primaryUser] = await Promise.all([
      this.userPatients.find({ where: { pacienteId: notification.pacienteId }, select: { usuarioId: true } }),
      this.users.find({ where: { pacienteId: notification.pacienteId }, select: { id: true } }),
    ]);
    const userIds = [...new Set([...relations.map((relation) => relation.usuarioId), ...primaryUser.map((user) => user.id)])];
    if (!userIds.length) return false;
    const devices = await this.devices.createQueryBuilder("device")
      .where("device.activo = :active", { active: true })
      .andWhere("device.usuarioid IN (:...userIds)", { userIds }).getMany();
    if (!devices.length) return false;

    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(devices.map((device) => ({
        to: device.expoPushToken, title: "Recordatorio de salud", body: notification.mensaje,
        sound: "default", channelId: "recordatorios-locales",
        data: { notificationId: notification.notificacionId, patientId: notification.pacienteId },
      }))),
    });
    if (!response.ok) {
      this.logger.warn(`Expo Push respondio ${response.status} para la notificacion ${notification.notificacionId}`);
      return false;
    }
    const tickets = ((await response.json()) as { data?: ExpoTicket[] }).data ?? [];
    await Promise.all(tickets.map((ticket, index) => ticket.details?.error === "DeviceNotRegistered"
      ? this.devices.update(devices[index].id, { active: false }) : undefined));
    return tickets.some((ticket) => ticket.status === "ok");
  }
}
