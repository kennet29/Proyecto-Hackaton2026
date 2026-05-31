import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Evaluacionsaludhabito } from "./evaluacionsaludhabito.entity";
import { EvaluacionsaludhabitoService } from "./evaluacionsaludhabito.service";
import { EvaluacionsaludhabitoController } from "./evaluacionsaludhabito.controller";

/**
 * Agrupa controladores y proveedores del dominio evaluacionsaludhabito.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Evaluacionsaludhabito])],
  controllers: [EvaluacionsaludhabitoController],
  providers: [EvaluacionsaludhabitoService],
  exports: [EvaluacionsaludhabitoService],
})
export class EvaluacionsaludhabitoModule {}
