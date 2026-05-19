import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Paciente } from "../paciente/paciente.entity";
import { SeguimientofisicoController } from "./seguimientofisico.controller";
import { Seguimientofisico } from "./seguimientofisico.entity";
import { SeguimientofisicoService } from "./seguimientofisico.service";

/**
 * Agrupa controladores y proveedores del dominio seguimientofisico.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Seguimientofisico, Paciente])],
  controllers: [SeguimientofisicoController],
  providers: [SeguimientofisicoService],
  exports: [SeguimientofisicoService],
})
export class SeguimientofisicoModule {}
