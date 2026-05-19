import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Notificacion } from "./notificacion.entity";
import { NotificacionService } from "./notificacion.service";
import { NotificacionController } from "./notificacion.controller";

/**
 * Agrupa controladores y proveedores del dominio notificacion.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Notificacion])],
  controllers: [NotificacionController],
  providers: [NotificacionService],
  exports: [NotificacionService],
})
export class NotificacionModule {}
