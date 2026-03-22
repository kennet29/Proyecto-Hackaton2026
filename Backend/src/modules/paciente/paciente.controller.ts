import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { PacienteService } from './paciente.service';
import { CreatePacienteDto } from './dto/create-paciente.dto';
import { UpdatePacienteDto } from './dto/update-paciente.dto';

@Controller('paciente')
export class PacienteController {
  constructor(private readonly pacienteservice: PacienteService) {}

  @Post()
  create(@Body() payload: CreatePacienteDto) {
    return this.pacienteservice.create(payload);
  }

  @Get()
  findAll() {
    return this.pacienteservice.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pacienteservice.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: UpdatePacienteDto) {
    return this.pacienteservice.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pacienteservice.remove(id);
  }
}

