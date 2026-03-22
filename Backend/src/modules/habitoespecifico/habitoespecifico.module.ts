import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Habitoespecifico } from './habitoespecifico.entity';
import { HabitoespecificoService } from './habitoespecifico.service';
import { HabitoespecificoController } from './habitoespecifico.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Habitoespecifico])],
  controllers: [HabitoespecificoController],
  providers: [HabitoespecificoService],
  exports: [HabitoespecificoService],
})
export class HabitoespecificoModule {}

