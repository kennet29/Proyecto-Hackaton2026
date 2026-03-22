import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Puntajeriesgo } from './puntajeriesgo.entity';
import { PuntajeriesgoService } from './puntajeriesgo.service';
import { PuntajeriesgoController } from './puntajeriesgo.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Puntajeriesgo])],
  controllers: [PuntajeriesgoController],
  providers: [PuntajeriesgoService],
  exports: [PuntajeriesgoService],
})
export class PuntajeriesgoModule {}

