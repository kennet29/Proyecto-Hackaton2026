import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PermisoAcceso } from "./permisoacceso.entity";
import { PermisoaccesoController } from "./permisoacceso.controller";
import { PermisoaccesoService } from "./permisoacceso.service";
import { UsersModule } from "../../users/users.module";
import { AuthModule } from "../../auth/auth.module";
import { PermisoAccesoToken } from "./permisoacceso-token.entity";

/**
 * Agrupa controladores y proveedores del dominio permisoacceso.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([PermisoAcceso, PermisoAccesoToken]),
    UsersModule,
    AuthModule,
  ],
  controllers: [PermisoaccesoController],
  providers: [PermisoaccesoService],
  exports: [PermisoaccesoService],
})
export class PermisoaccesoModule {}
