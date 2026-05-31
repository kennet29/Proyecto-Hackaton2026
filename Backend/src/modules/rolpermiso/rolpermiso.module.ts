import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Rolpermiso } from "./rolpermiso.entity";
import { RolpermisoService } from "./rolpermiso.service";
import { RolpermisoController } from "./rolpermiso.controller";

/**
 * Agrupa controladores y proveedores del dominio rolpermiso.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Rolpermiso])],
  controllers: [RolpermisoController],
  providers: [RolpermisoService],
  exports: [RolpermisoService],
})
export class RolpermisoModule {}
