import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Embarazo } from './embarazo.entity';
import { EmbarazoService } from './embarazo.service';
import { EmbarazoController } from './embarazo.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Embarazo])],
  controllers: [EmbarazoController],
  providers: [EmbarazoService],
  exports: [EmbarazoService],
})
export class EmbarazoModule {}

