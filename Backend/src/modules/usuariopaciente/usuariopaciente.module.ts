import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsuarioPaciente } from "./usuariopaciente.entity";
import { UsuarioPacienteService } from "./usuariopaciente.service";
import { UsuarioPacienteController } from "./usuariopaciente.controller";
import { PermisoAcceso } from "../permisoacceso/permisoacceso.entity";

/**
 * Agrupa controladores y proveedores del dominio usuario paciente.
 */
@Module({
  imports: [TypeOrmModule.forFeature([UsuarioPaciente, PermisoAcceso])],
  controllers: [UsuarioPacienteController],
  providers: [UsuarioPacienteService],
  exports: [UsuarioPacienteService],
})
export class UsuarioPacienteModule {}
