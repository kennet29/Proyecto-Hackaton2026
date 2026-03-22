import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Detalleevaluacionsalud } from './detalleevaluacionsalud.entity';
import { DetalleevaluacionsaludService } from './detalleevaluacionsalud.service';
import { DetalleevaluacionsaludController } from './detalleevaluacionsalud.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Detalleevaluacionsalud])],
  controllers: [DetalleevaluacionsaludController],
  providers: [DetalleevaluacionsaludService],
  exports: [DetalleevaluacionsaludService],
})
export class DetalleevaluacionsaludModule {}

