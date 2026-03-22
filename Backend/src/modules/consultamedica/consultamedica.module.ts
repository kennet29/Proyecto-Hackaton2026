import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Consultamedica } from './consultamedica.entity';
import { ConsultamedicaService } from './consultamedica.service';
import { ConsultamedicaController } from './consultamedica.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Consultamedica])],
  controllers: [ConsultamedicaController],
  providers: [ConsultamedicaService],
  exports: [ConsultamedicaService],
})
export class ConsultamedicaModule {}

