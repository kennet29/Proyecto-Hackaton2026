import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Paciente } from '../paciente/paciente.entity';
import { PeriodoController } from './periodo.controller';
import { Periodo } from './periodo.entity';
import { PeriodoService } from './periodo.service';

@Module({
  imports: [TypeOrmModule.forFeature([Periodo, Paciente])],
  controllers: [PeriodoController],
  providers: [PeriodoService],
  exports: [PeriodoService],
})
export class PeriodoModule {}
