import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InstitucionsaludController } from './institucionsalud.controller';
import { Institucionsalud } from './institucionsalud.entity';
import { InstitucionsaludService } from './institucionsalud.service';

@Module({
  imports: [TypeOrmModule.forFeature([Institucionsalud])],
  controllers: [InstitucionsaludController],
  providers: [InstitucionsaludService],
  exports: [InstitucionsaludService],
})
export class InstitucionsaludModule {}
