import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Citamedica } from "./citamedica.entity";
import { CitamedicaService } from "./citamedica.service";
import { CitamedicaController } from "./citamedica.controller";

/**
 * Agrupa controladores y proveedores del dominio citamedica.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Citamedica])],
  controllers: [CitamedicaController],
  providers: [CitamedicaService],
  exports: [CitamedicaService],
})
export class CitamedicaModule {}
