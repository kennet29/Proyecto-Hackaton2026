import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../../auth/auth.module";
import { Citamedica } from "../citamedica/citamedica.entity";
import { Condicioncronica } from "../condicioncronica/condicioncronica.entity";
import { Consultamedica } from "../consultamedica/consultamedica.entity";
import { Examenclinico } from "../examenclinico/examenclinico.entity";
import { Estilovida } from "../estilovida/estilovida.entity";
import { Habitoespecifico } from "../habitoespecifico/habitoespecifico.entity";
import { Lesion } from "../lesion/lesion.entity";
import { Medicacion } from "../medicacion/medicacion.entity";
import { Operacion } from "../operacion/operacion.entity";
import { Paciente } from "./paciente.entity";
import { PacienteService } from "./paciente.service";
import { PacienteController } from "./paciente.controller";
import { Seguimientopostevento } from "../seguimientopostevento/seguimientopostevento.entity";
import { Seguimientofisico } from "../seguimientofisico/seguimientofisico.entity";
import { Tipocondicioncronica } from "../tipocondicioncronica/tipocondicioncronica.entity";

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
      Seguimientofisico,
      Estilovida,
      Habitoespecifico,
      Condicioncronica,
      Tipocondicioncronica,
      Lesion,
      Operacion,
    ]),
  ],
  controllers: [PacienteController],
  providers: [PacienteService],
  exports: [PacienteService],
})
export class PacienteModule {}
