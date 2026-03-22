import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CitamedicaService } from './citamedica.service';
import { CreateCitamedicaDto } from './dto/create-citamedica.dto';
import { UpdateCitamedicaDto } from './dto/update-citamedica.dto';

@Controller('citamedica')
export class CitamedicaController {
  constructor(private readonly citamedicaservice: CitamedicaService) {}

  @Post()
  create(@Body() payload: CreateCitamedicaDto) {
    return this.citamedicaservice.create(payload);
  }

  @Get()
  findAll() {
    return this.citamedicaservice.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.citamedicaservice.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: UpdateCitamedicaDto) {
    return this.citamedicaservice.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.citamedicaservice.remove(id);
  }
}

