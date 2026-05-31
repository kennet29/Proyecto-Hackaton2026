import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ExamenclinicoController } from "./examenclinico.controller";
import { Examenclinico } from "./examenclinico.entity";
import { ExamenclinicoService } from "./examenclinico.service";

/**
 * Agrupa controladores y proveedores del dominio examenclinico.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Examenclinico])],
  controllers: [ExamenclinicoController],
  providers: [ExamenclinicoService],
  exports: [ExamenclinicoService],
})
export class ExamenclinicoModule {}
