import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tipolesion } from './tipolesion.entity';
import { TipolesionService } from './tipolesion.service';
import { TipolesionController } from './tipolesion.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Tipolesion])],
  controllers: [TipolesionController],
  providers: [TipolesionService],
  exports: [TipolesionService],
})
export class TipolesionModule {}

