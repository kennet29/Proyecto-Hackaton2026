import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Institucionsalud } from "../institucionsalud/institucionsalud.entity";
import { InstitucionimagenController } from "./institucionimagen.controller";
import { Institucionimagen } from "./institucionimagen.entity";
import { InstitucionimagenService } from "./institucionimagen.service";

/**
 * Agrupa controladores y proveedores del dominio institucionimagen.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Institucionimagen, Institucionsalud])],
  controllers: [InstitucionimagenController],
  providers: [InstitucionimagenService],
  exports: [InstitucionimagenService],
})
export class InstitucionimagenModule {}
