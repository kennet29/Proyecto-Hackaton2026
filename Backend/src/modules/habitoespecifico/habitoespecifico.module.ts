import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Habitoespecifico } from "./habitoespecifico.entity";
import { HabitoespecificoService } from "./habitoespecifico.service";
import { HabitoespecificoController } from "./habitoespecifico.controller";

/**
 * Agrupa controladores y proveedores del dominio habitoespecifico.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Habitoespecifico])],
  controllers: [HabitoespecificoController],
  providers: [HabitoespecificoService],
  exports: [HabitoespecificoService],
})
export class HabitoespecificoModule {}
