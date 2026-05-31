import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Consultamedica } from "./consultamedica.entity";
import { ConsultamedicaService } from "./consultamedica.service";
import { ConsultamedicaController } from "./consultamedica.controller";
import { AuthModule } from "../../auth/auth.module";

/**
 * Agrupa controladores y proveedores del dominio consultamedica.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Consultamedica]), AuthModule],
  controllers: [ConsultamedicaController],
  providers: [ConsultamedicaService],
  exports: [ConsultamedicaService],
})
export class ConsultamedicaModule {}
