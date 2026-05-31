import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Permiso } from "./permiso.entity";
import { PermisoService } from "./permiso.service";
import { PermisoController } from "./permiso.controller";

/**
 * Agrupa controladores y proveedores del dominio permiso.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Permiso])],
  controllers: [PermisoController],
  providers: [PermisoService],
  exports: [PermisoService],
})
export class PermisoModule {}
