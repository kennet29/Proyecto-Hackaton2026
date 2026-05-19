import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Lesion } from "./lesion.entity";
import { LesionService } from "./lesion.service";
import { LesionController } from "./lesion.controller";

/**
 * Agrupa controladores y proveedores del dominio lesion.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Lesion])],
  controllers: [LesionController],
  providers: [LesionService],
  exports: [LesionService],
})
export class LesionModule {}
