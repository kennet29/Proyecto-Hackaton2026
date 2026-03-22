import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tipocondicioncronica } from './tipocondicioncronica.entity';
import { TipocondicioncronicaService } from './tipocondicioncronica.service';
import { TipocondicioncronicaController } from './tipocondicioncronica.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Tipocondicioncronica])],
  controllers: [TipocondicioncronicaController],
  providers: [TipocondicioncronicaService],
  exports: [TipocondicioncronicaService],
})
export class TipocondicioncronicaModule {}

