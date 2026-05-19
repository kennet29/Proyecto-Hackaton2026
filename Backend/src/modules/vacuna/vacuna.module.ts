import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Vacuna } from "./vacuna.entity";
import { VacunaService } from "./vacuna.service";
import { VacunaController } from "./vacuna.controller";

/**
 * Agrupa controladores y proveedores del dominio vacuna.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Vacuna])],
  controllers: [VacunaController],
  providers: [VacunaService],
  exports: [VacunaService],
})
export class VacunaModule {}
