import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../../auth/auth.module";
import { Citamedica } from "../citamedica/citamedica.entity";
import { Consultamedica } from "../consultamedica/consultamedica.entity";
import { Examenclinico } from "../examenclinico/examenclinico.entity";
import { Medicacion } from "../medicacion/medicacion.entity";
import { Paciente } from "./paciente.entity";
import { PacienteService } from "./paciente.service";
import { PacienteController } from "./paciente.controller";
import { Seguimientopostevento } from "../seguimientopostevento/seguimientopostevento.entity";

/**
 * Agrupa controladores y proveedores del dominio paciente.
 */
@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      Paciente,
      Citamedica,
      Consultamedica,
      Examenclinico,
      Medicacion,
      Seguimientopostevento,
    ]),
  ],
  controllers: [PacienteController],
  providers: [PacienteService],
  exports: [PacienteService],
})
export class PacienteModule {}
