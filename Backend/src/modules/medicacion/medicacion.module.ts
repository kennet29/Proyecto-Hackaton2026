import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Medicacion } from "./medicacion.entity";
import { MedicacionService } from "./medicacion.service";
import { MedicacionController } from "./medicacion.controller";

/**
 * Agrupa controladores y proveedores del dominio medicacion.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Medicacion])],
  controllers: [MedicacionController],
  providers: [MedicacionService],
  exports: [MedicacionService],
})
export class MedicacionModule {}
