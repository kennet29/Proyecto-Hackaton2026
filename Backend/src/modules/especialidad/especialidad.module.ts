import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Especialidad } from "./especialidad.entity";
import { EspecialidadService } from "./especialidad.service";
import { EspecialidadController } from "./especialidad.controller";

/**
 * Agrupa controladores y proveedores del dominio especialidad.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Especialidad])],
  controllers: [EspecialidadController],
  providers: [EspecialidadService],
  exports: [EspecialidadService],
})
export class EspecialidadModule {}
