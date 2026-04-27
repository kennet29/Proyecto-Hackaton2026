import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Paciente } from '../paciente/paciente.entity';
import { SaludmentalController } from './saludmental.controller';
import { Saludmental } from './saludmental.entity';
import { SaludmentalService } from './saludmental.service';

@Module({
  imports: [TypeOrmModule.forFeature([Saludmental, Paciente])],
  controllers: [SaludmentalController],
  providers: [SaludmentalService],
  exports: [SaludmentalService],
})
export class SaludmentalModule {}
