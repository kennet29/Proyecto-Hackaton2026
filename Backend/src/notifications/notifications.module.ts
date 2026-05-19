import { Module } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { NotificationsController } from "./notifications.controller";
import { NotificacionModule } from "../modules/notificacion/notificacion.module";

/**
 * Agrupa controladores y proveedores del dominio notifications.
 */
@Module({
  imports: [NotificacionModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
