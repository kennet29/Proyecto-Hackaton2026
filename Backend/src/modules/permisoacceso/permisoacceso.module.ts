import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PermisoAcceso } from "./permisoacceso.entity";
import { PermisoaccesoController } from "./permisoacceso.controller";
import { PermisoaccesoService } from "./permisoacceso.service";
import { UsersModule } from "../../users/users.module";
import { AuthModule } from "../../auth/auth.module";
import { PermisoAccesoToken } from "./permisoacceso-token.entity";
import { PacienteModule } from "../paciente/paciente.module";
import { ConsultamedicaModule } from "../consultamedica/consultamedica.module";
import { SaludmentalModule } from "../saludmental/saludmental.module";
import { PeriodoModule } from "../periodo/periodo.module";
import { SeguimientofisicoModule } from "../seguimientofisico/seguimientofisico.module";
import { SeguimientoposteventoModule } from "../seguimientopostevento/seguimientopostevento.module";
import { ExamenclinicoModule } from "../examenclinico/examenclinico.module";

/**
 * Agrupa controladores y proveedores del dominio permisoacceso.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([PermisoAcceso, PermisoAccesoToken]),
    UsersModule,
    AuthModule,
    PacienteModule,
    ConsultamedicaModule,
    SaludmentalModule,
    PeriodoModule,
    SeguimientofisicoModule,
    SeguimientoposteventoModule,
    ExamenclinicoModule,
  ],
  controllers: [PermisoaccesoController],
  providers: [PermisoaccesoService],
  exports: [PermisoaccesoService],
})
export class PermisoaccesoModule {}
