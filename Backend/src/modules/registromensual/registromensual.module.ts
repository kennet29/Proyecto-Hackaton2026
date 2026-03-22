import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Registromensual } from './registromensual.entity';
import { RegistromensualService } from './registromensual.service';
import { RegistromensualController } from './registromensual.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Registromensual])],
  controllers: [RegistromensualController],
  providers: [RegistromensualService],
  exports: [RegistromensualService],
})
export class RegistromensualModule {}

