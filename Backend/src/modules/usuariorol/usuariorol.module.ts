import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuariorol } from './usuariorol.entity';
import { UsuariorolService } from './usuariorol.service';
import { UsuariorolController } from './usuariorol.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Usuariorol])],
  controllers: [UsuariorolController],
  providers: [UsuariorolService],
  exports: [UsuariorolService],
})
export class UsuariorolModule {}

