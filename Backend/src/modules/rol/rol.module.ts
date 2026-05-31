import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Rol } from "./rol.entity";
import { RolService } from "./rol.service";
import { RolController } from "./rol.controller";

/**
 * Agrupa controladores y proveedores del dominio rol.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Rol])],
  controllers: [RolController],
  providers: [RolService],
  exports: [RolService],
})
export class RolModule {}
