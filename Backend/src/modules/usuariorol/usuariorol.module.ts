import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Usuariorol } from "./usuariorol.entity";
import { UsuariorolService } from "./usuariorol.service";
import { UsuariorolController } from "./usuariorol.controller";

/**
 * Agrupa controladores y proveedores del dominio usuariorol.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Usuariorol])],
  controllers: [UsuariorolController],
  providers: [UsuariorolService],
  exports: [UsuariorolService],
})
export class UsuariorolModule {}
