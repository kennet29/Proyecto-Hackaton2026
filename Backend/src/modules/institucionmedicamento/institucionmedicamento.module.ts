import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Institucionsalud } from "../institucionsalud/institucionsalud.entity";
import { Medicamentoraro } from "../medicamentoraro/medicamentoraro.entity";
import { InstitucionmedicamentoController } from "./institucionmedicamento.controller";
import { Institucionmedicamento } from "./institucionmedicamento.entity";
import { InstitucionmedicamentoService } from "./institucionmedicamento.service";

/**
 * Agrupa controladores y proveedores del dominio institucionmedicamento.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Institucionmedicamento,
      Institucionsalud,
      Medicamentoraro,
    ]),
  ],
  controllers: [InstitucionmedicamentoController],
  providers: [InstitucionmedicamentoService],
  exports: [InstitucionmedicamentoService],
})
export class InstitucionmedicamentoModule {}
