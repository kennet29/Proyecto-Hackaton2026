import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Institucionsalud } from "../institucionsalud/institucionsalud.entity";
import { InstitucionhorarioController } from "./institucionhorario.controller";
import { Institucionhorario } from "./institucionhorario.entity";
import { InstitucionhorarioService } from "./institucionhorario.service";

/**
 * Agrupa controladores y proveedores del dominio institucionhorario.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Institucionhorario, Institucionsalud])],
  controllers: [InstitucionhorarioController],
  providers: [InstitucionhorarioService],
  exports: [InstitucionhorarioService],
})
export class InstitucionhorarioModule {}
