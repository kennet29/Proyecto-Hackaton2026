import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ConsultamedicaService } from './consultamedica.service';
import { CreateConsultamedicaDto } from './dto/create-consultamedica.dto';
import { UpdateConsultamedicaDto } from './dto/update-consultamedica.dto';

@Controller('consultamedica')
export class ConsultamedicaController {
  constructor(private readonly consultamedicaservice: ConsultamedicaService) {}

  @Post()
  create(@Body() payload: CreateConsultamedicaDto) {
    return this.consultamedicaservice.create(payload);
  }

  @Get()
  findAll() {
    return this.consultamedicaservice.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.consultamedicaservice.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: UpdateConsultamedicaDto) {
    return this.consultamedicaservice.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.consultamedicaservice.remove(id);
  }
}

