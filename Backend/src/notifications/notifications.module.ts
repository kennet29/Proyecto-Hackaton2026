import { Module } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { NotificationsController } from "./notifications.controller";
import { NotificacionModule } from "../modules/notificacion/notificacion.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PushDevice } from "./push-device.entity";
import { PushNotificationsService } from "./push-notifications.service";
import { Notificacion } from "../modules/notificacion/notificacion.entity";
import { UsuarioPaciente } from "../modules/usuariopaciente/usuariopaciente.entity";
import { Usuario } from "../users/entities/user.entity";

/**
 * Agrupa controladores y proveedores del dominio notifications.
 */
@Module({
  imports: [NotificacionModule, TypeOrmModule.forFeature([PushDevice, Notificacion, UsuarioPaciente, Usuario])],
  controllers: [NotificationsController],
  providers: [NotificationsService, PushNotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
