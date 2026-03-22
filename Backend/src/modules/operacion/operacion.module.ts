import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Operacion } from './operacion.entity';
import { OperacionService } from './operacion.service';
import { OperacionController } from './operacion.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Operacion])],
  controllers: [OperacionController],
  providers: [OperacionService],
  exports: [OperacionService],
})
export class OperacionModule {}

