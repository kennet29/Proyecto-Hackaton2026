import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Antecedentefamiliar } from "./antecedentefamiliar.entity";
import { AntecedentefamiliarService } from "./antecedentefamiliar.service";
import { AntecedentefamiliarController } from "./antecedentefamiliar.controller";

/**
 * Agrupa controladores y proveedores del dominio antecedentefamiliar.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Antecedentefamiliar])],
  controllers: [AntecedentefamiliarController],
  providers: [AntecedentefamiliarService],
  exports: [AntecedentefamiliarService],
})
export class AntecedentefamiliarModule {}
