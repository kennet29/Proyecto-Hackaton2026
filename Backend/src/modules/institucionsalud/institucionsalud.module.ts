import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { InstitucionsaludController } from "./institucionsalud.controller";
import { Institucionsalud } from "./institucionsalud.entity";
import { InstitucionsaludService } from "./institucionsalud.service";
import { Institucionservicio } from "../institucionservicio/institucionservicio.entity";
import { Catalogoservicio } from "../catalogoservicio/catalogoservicio.entity";

/**
 * Agrupa controladores y proveedores del dominio institucionsalud.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Institucionsalud,
      Institucionservicio,
      Catalogoservicio,
    ]),
  ],
  controllers: [InstitucionsaludController],
  providers: [InstitucionsaludService],
  exports: [InstitucionsaludService],
})
export class InstitucionsaludModule {}
