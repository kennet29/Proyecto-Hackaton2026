import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Recordatoriocita } from "./recordatoriocita.entity";
import { RecordatoriocitaService } from "./recordatoriocita.service";
import { RecordatoriocitaController } from "./recordatoriocita.controller";

/**
 * Agrupa controladores y proveedores del dominio recordatoriocita.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Recordatoriocita])],
  controllers: [RecordatoriocitaController],
  providers: [RecordatoriocitaService],
  exports: [RecordatoriocitaService],
})
export class RecordatoriocitaModule {}
