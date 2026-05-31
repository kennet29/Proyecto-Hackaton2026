import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Controlcronico } from "./controlcronico.entity";
import { ControlcronicoService } from "./controlcronico.service";
import { ControlcronicoController } from "./controlcronico.controller";

/**
 * Agrupa controladores y proveedores del dominio controlcronico.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Controlcronico])],
  controllers: [ControlcronicoController],
  providers: [ControlcronicoService],
  exports: [ControlcronicoService],
})
export class ControlcronicoModule {}
