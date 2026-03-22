import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tipodocumentoclinico } from './tipodocumentoclinico.entity';
import { TipodocumentoclinicoService } from './tipodocumentoclinico.service';
import { TipodocumentoclinicoController } from './tipodocumentoclinico.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Tipodocumentoclinico])],
  controllers: [TipodocumentoclinicoController],
  providers: [TipodocumentoclinicoService],
  exports: [TipodocumentoclinicoService],
})
export class TipodocumentoclinicoModule {}

