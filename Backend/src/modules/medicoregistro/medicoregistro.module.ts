import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Usuario } from "../../users/entities/user.entity";
import { MedicoregistroController } from "./medicoregistro.controller";
import { Medicoregistro } from "./medicoregistro.entity";
import { MedicoregistroService } from "./medicoregistro.service";

/**
 * Agrupa controladores y proveedores del dominio medicoregistro.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Medicoregistro, Usuario])],
  controllers: [MedicoregistroController],
  providers: [MedicoregistroService],
  exports: [MedicoregistroService],
})
export class MedicoregistroModule {}
