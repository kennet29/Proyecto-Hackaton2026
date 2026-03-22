import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Adherenciacronica } from './adherenciacronica.entity';
import { AdherenciacronicaService } from './adherenciacronica.service';
import { AdherenciacronicaController } from './adherenciacronica.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Adherenciacronica])],
  controllers: [AdherenciacronicaController],
  providers: [AdherenciacronicaService],
  exports: [AdherenciacronicaService],
})
export class AdherenciacronicaModule {}

