import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Registrodental } from './registrodental.entity';
import { RegistrodentalService } from './registrodental.service';
import { RegistrodentalController } from './registrodental.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Registrodental])],
  controllers: [RegistrodentalController],
  providers: [RegistrodentalService],
  exports: [RegistrodentalService],
})
export class RegistrodentalModule {}

