import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../../auth/auth.module';
import { Paciente } from '../paciente/paciente.entity';
import { SaludmentalController } from './saludmental.controller';
import { Saludmental } from './saludmental.entity';
import { SaludmentalService } from './saludmental.service';

@Module({
  imports: [TypeOrmModule.forFeature([Saludmental, Paciente]), AuthModule],
  controllers: [SaludmentalController],
  providers: [SaludmentalService],
  exports: [SaludmentalService],
})
export class SaludmentalModule {}
