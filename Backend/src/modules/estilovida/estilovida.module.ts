import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Estilovida } from './estilovida.entity';
import { EstilovidaService } from './estilovida.service';
import { EstilovidaController } from './estilovida.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Estilovida])],
  controllers: [EstilovidaController],
  providers: [EstilovidaService],
  exports: [EstilovidaService],
})
export class EstilovidaModule {}

