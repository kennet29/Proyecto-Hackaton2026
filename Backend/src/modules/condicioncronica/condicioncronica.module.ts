import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Condicioncronica } from "./condicioncronica.entity";
import { CondicioncronicaService } from "./condicioncronica.service";
import { CondicioncronicaController } from "./condicioncronica.controller";

/**
 * Agrupa controladores y proveedores del dominio condicioncronica.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Condicioncronica])],
  controllers: [CondicioncronicaController],
  providers: [CondicioncronicaService],
  exports: [CondicioncronicaService],
})
export class CondicioncronicaModule {}
