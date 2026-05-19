import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Tipohabito } from "./tipohabito.entity";
import { TipohabitoService } from "./tipohabito.service";
import { TipohabitoController } from "./tipohabito.controller";

/**
 * Agrupa controladores y proveedores del dominio tipohabito.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Tipohabito])],
  controllers: [TipohabitoController],
  providers: [TipohabitoService],
  exports: [TipohabitoService],
})
export class TipohabitoModule {}
