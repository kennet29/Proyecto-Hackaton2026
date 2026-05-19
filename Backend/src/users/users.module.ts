import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { Usuario } from "./entities/user.entity";

/**
 * Agrupa controladores y proveedores del dominio users.
 */
@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([Usuario])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
