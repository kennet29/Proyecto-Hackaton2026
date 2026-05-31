import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Lesion } from "../lesion/lesion.entity";
import { Operacion } from "../operacion/operacion.entity";
import { Paciente } from "../paciente/paciente.entity";
import { SeguimientoposteventoController } from "./seguimientopostevento.controller";
import { Seguimientopostevento } from "./seguimientopostevento.entity";
import { SeguimientoposteventoService } from "./seguimientopostevento.service";

/**
 * Agrupa controladores y proveedores del dominio seguimientopostevento.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Seguimientopostevento,
      Paciente,
      Operacion,
      Lesion,
    ]),
  ],
  controllers: [SeguimientoposteventoController],
  providers: [SeguimientoposteventoService],
  exports: [SeguimientoposteventoService],
})
export class SeguimientoposteventoModule {}
