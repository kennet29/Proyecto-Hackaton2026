import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Objetivocronico } from './objetivocronico.entity';
import { ObjetivocronicoService } from './objetivocronico.service';
import { ObjetivocronicoController } from './objetivocronico.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Objetivocronico])],
  controllers: [ObjetivocronicoController],
  providers: [ObjetivocronicoService],
  exports: [ObjetivocronicoService],
})
export class ObjetivocronicoModule {}

