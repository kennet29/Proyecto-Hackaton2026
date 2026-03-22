import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { EspecialidadService } from './especialidad.service';
import { CreateEspecialidadDto } from './dto/create-especialidad.dto';
import { UpdateEspecialidadDto } from './dto/update-especialidad.dto';

@Controller('especialidad')
export class EspecialidadController {
  constructor(private readonly especialidadservice: EspecialidadService) {}

  @Post()
  create(@Body() payload: CreateEspecialidadDto) {
    return this.especialidadservice.create(payload);
  }

  @Get()
  findAll() {
    return this.especialidadservice.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.especialidadservice.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: UpdateEspecialidadDto) {
    return this.especialidadservice.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.especialidadservice.remove(id);
  }
}

