import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../../auth/auth.module";
import { Alergia } from "../alergia/alergia.entity";
import { Antecedentefamiliar } from "../antecedentefamiliar/antecedentefamiliar.entity";
import { Citamedica } from "../citamedica/citamedica.entity";
import { Condicioncronica } from "../condicioncronica/condicioncronica.entity";
import { Consultamedica } from "../consultamedica/consultamedica.entity";
import { Desparasitacion } from "../desparasitacion/desparasitacion.entity";
import { Documentoclinico } from "../documentoclinico/documentoclinico.entity";
import { Embarazo } from "../embarazo/embarazo.entity";
import { Examenclinico } from "../examenclinico/examenclinico.entity";
import { Estilovida } from "../estilovida/estilovida.entity";
import { Evaluacionsaludhabito } from "../evaluacionsaludhabito/evaluacionsaludhabito.entity";
import { Habitoespecifico } from "../habitoespecifico/habitoespecifico.entity";
import { Lesion } from "../lesion/lesion.entity";
import { Medicacion } from "../medicacion/medicacion.entity";
import { Operacion } from "../operacion/operacion.entity";
import { Periodo } from "../periodo/periodo.entity";
import { Puntajeriesgo } from "../puntajeriesgo/puntajeriesgo.entity";
import { Recordatoriocita } from "../recordatoriocita/recordatoriocita.entity";
import { Registrodental } from "../registrodental/registrodental.entity";
import { Registromensual } from "../registromensual/registromensual.entity";
import { Saludmental } from "../saludmental/saludmental.entity";
import { Vacuna } from "../vacuna/vacuna.entity";
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
      Saludmental,
      Alergia,
      Antecedentefamiliar,
      Desparasitacion,
      Documentoclinico,
      Embarazo,
      Evaluacionsaludhabito,
      Periodo,
      Puntajeriesgo,
      Recordatoriocita,
      Registrodental,
      Registromensual,
      Vacuna,
    ]),
  ],
  controllers: [PacienteController],
  providers: [PacienteService],
  exports: [PacienteService],
})
export class PacienteModule {}
