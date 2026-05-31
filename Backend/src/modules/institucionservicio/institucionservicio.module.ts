import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Catalogoservicio } from "../catalogoservicio/catalogoservicio.entity";
import { Institucionsalud } from "../institucionsalud/institucionsalud.entity";
import { InstitucionservicioController } from "./institucionservicio.controller";
import { Institucionservicio } from "./institucionservicio.entity";
import { InstitucionservicioService } from "./institucionservicio.service";

/**
 * Agrupa controladores y proveedores del dominio institucionservicio.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Institucionservicio,
      Institucionsalud,
      Catalogoservicio,
    ]),
  ],
  controllers: [InstitucionservicioController],
  providers: [InstitucionservicioService],
  exports: [InstitucionservicioService],
})
export class InstitucionservicioModule {}
