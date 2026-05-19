import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Horariomedicamento } from "./horariomedicamento.entity";
import { HorariomedicamentoService } from "./horariomedicamento.service";
import { HorariomedicamentoController } from "./horariomedicamento.controller";

/**
 * Agrupa controladores y proveedores del dominio horariomedicamento.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Horariomedicamento])],
  controllers: [HorariomedicamentoController],
  providers: [HorariomedicamentoService],
  exports: [HorariomedicamentoService],
})
export class HorariomedicamentoModule {}
