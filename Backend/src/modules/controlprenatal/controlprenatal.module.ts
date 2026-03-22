import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Controlprenatal } from './controlprenatal.entity';
import { ControlprenatalService } from './controlprenatal.service';
import { ControlprenatalController } from './controlprenatal.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Controlprenatal])],
  controllers: [ControlprenatalController],
  providers: [ControlprenatalService],
  exports: [ControlprenatalService],
})
export class ControlprenatalModule {}

