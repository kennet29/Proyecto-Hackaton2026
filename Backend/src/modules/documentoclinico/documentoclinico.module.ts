import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Documentoclinico } from './documentoclinico.entity';
import { DocumentoclinicoService } from './documentoclinico.service';
import { DocumentoclinicoController } from './documentoclinico.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Documentoclinico])],
  controllers: [DocumentoclinicoController],
  providers: [DocumentoclinicoService],
  exports: [DocumentoclinicoService],
})
export class DocumentoclinicoModule {}

