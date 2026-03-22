import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Antecedentefamiliar } from './antecedentefamiliar.entity';
import { AntecedentefamiliarService } from './antecedentefamiliar.service';
import { AntecedentefamiliarController } from './antecedentefamiliar.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Antecedentefamiliar])],
  controllers: [AntecedentefamiliarController],
  providers: [AntecedentefamiliarService],
  exports: [AntecedentefamiliarService],
})
export class AntecedentefamiliarModule {}

