import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Especialidad } from '../especialidad/especialidad.entity';
import { Institucionsalud } from '../institucionsalud/institucionsalud.entity';
import { InstitucionespecialidadController } from './institucionespecialidad.controller';
import { Institucionespecialidad } from './institucionespecialidad.entity';
import { InstitucionespecialidadService } from './institucionespecialidad.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Institucionespecialidad,
      Institucionsalud,
      Especialidad,
    ]),
  ],
  controllers: [InstitucionespecialidadController],
  providers: [InstitucionespecialidadService],
  exports: [InstitucionespecialidadService],
})
export class InstitucionespecialidadModule {}
