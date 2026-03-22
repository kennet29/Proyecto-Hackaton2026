import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tipooperacion } from './tipooperacion.entity';
import { TipooperacionService } from './tipooperacion.service';
import { TipooperacionController } from './tipooperacion.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Tipooperacion])],
  controllers: [TipooperacionController],
  providers: [TipooperacionService],
  exports: [TipooperacionService],
})
export class TipooperacionModule {}

