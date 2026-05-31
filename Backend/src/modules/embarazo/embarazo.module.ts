import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Embarazo } from "./embarazo.entity";
import { EmbarazoService } from "./embarazo.service";
import { EmbarazoController } from "./embarazo.controller";

/**
 * Agrupa controladores y proveedores del dominio embarazo.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Embarazo])],
  controllers: [EmbarazoController],
  providers: [EmbarazoService],
  exports: [EmbarazoService],
})
export class EmbarazoModule {}
