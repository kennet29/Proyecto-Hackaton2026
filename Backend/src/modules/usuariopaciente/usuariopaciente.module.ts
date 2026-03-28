import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuarioPaciente } from './usuariopaciente.entity';
import { UsuarioPacienteService } from './usuariopaciente.service';
import { UsuarioPacienteController } from './usuariopaciente.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UsuarioPaciente])],
  controllers: [UsuarioPacienteController],
  providers: [UsuarioPacienteService],
  exports: [UsuarioPacienteService],
})
export class UsuarioPacienteModule {}
