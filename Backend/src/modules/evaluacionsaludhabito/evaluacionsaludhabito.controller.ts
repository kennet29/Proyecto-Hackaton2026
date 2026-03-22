import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { EvaluacionsaludhabitoService } from './evaluacionsaludhabito.service';
import { CreateEvaluacionsaludhabitoDto } from './dto/create-evaluacionsaludhabito.dto';
import { UpdateEvaluacionsaludhabitoDto } from './dto/update-evaluacionsaludhabito.dto';

@Controller('evaluacionsaludhabito')
export class EvaluacionsaludhabitoController {
  constructor(private readonly evaluacionsaludhabitoservice: EvaluacionsaludhabitoService) {}

  @Post()
  create(@Body() payload: CreateEvaluacionsaludhabitoDto) {
    return this.evaluacionsaludhabitoservice.create(payload);
  }

  @Get()
  findAll() {
    return this.evaluacionsaludhabitoservice.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.evaluacionsaludhabitoservice.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: UpdateEvaluacionsaludhabitoDto) {
    return this.evaluacionsaludhabitoservice.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.evaluacionsaludhabitoservice.remove(id);
  }
}

