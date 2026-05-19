import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Desparasitacion } from "./desparasitacion.entity";
import { DesparasitacionService } from "./desparasitacion.service";
import { DesparasitacionController } from "./desparasitacion.controller";

/**
 * Agrupa controladores y proveedores del dominio desparasitacion.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Desparasitacion])],
  controllers: [DesparasitacionController],
  providers: [DesparasitacionService],
  exports: [DesparasitacionService],
})
export class DesparasitacionModule {}
