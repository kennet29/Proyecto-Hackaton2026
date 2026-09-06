import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GastoMedicoPresupuestado } from "./gastomedico.entity";
import { PresupuestoMedicoController } from "./presupuestomedico.controller";
import { PresupuestoMedico } from "./presupuestomedico.entity";
import { PresupuestoMedicoSchemaService } from "./presupuestomedico-schema.service";
import { PresupuestoMedicoService } from "./presupuestomedico.service";

@Module({
  imports: [TypeOrmModule.forFeature([PresupuestoMedico, GastoMedicoPresupuestado])],
  controllers: [PresupuestoMedicoController],
  providers: [PresupuestoMedicoService, PresupuestoMedicoSchemaService],
})
export class PresupuestoMedicoModule {}
