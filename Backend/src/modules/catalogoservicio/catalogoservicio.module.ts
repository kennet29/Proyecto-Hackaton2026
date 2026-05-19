import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CatalogoservicioController } from "./catalogoservicio.controller";
import { Catalogoservicio } from "./catalogoservicio.entity";
import { CatalogoservicioService } from "./catalogoservicio.service";

/**
 * Agrupa controladores y proveedores del dominio catalogoservicio.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Catalogoservicio])],
  controllers: [CatalogoservicioController],
  providers: [CatalogoservicioService],
  exports: [CatalogoservicioService],
})
export class CatalogoservicioModule {}
