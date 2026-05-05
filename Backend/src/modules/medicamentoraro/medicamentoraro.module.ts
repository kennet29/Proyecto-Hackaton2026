import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicamentoraroController } from './medicamentoraro.controller';
import { Medicamentoraro } from './medicamentoraro.entity';
import { MedicamentoraroService } from './medicamentoraro.service';

@Module({
  imports: [TypeOrmModule.forFeature([Medicamentoraro])],
  controllers: [MedicamentoraroController],
  providers: [MedicamentoraroService],
  exports: [MedicamentoraroService],
})
export class MedicamentoraroModule {}
