import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tipovacuna } from './tipovacuna.entity';
import { TipovacunaService } from './tipovacuna.service';
import { TipovacunaController } from './tipovacuna.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Tipovacuna])],
  controllers: [TipovacunaController],
  providers: [TipovacunaService],
  exports: [TipovacunaService],
})
export class TipovacunaModule {}

