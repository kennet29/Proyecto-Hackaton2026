import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Alergia } from './alergia.entity';
import { AlergiaService } from './alergia.service';
import { AlergiaController } from './alergia.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Alergia])],
  controllers: [AlergiaController],
  providers: [AlergiaService],
  exports: [AlergiaService],
})
export class AlergiaModule {}

