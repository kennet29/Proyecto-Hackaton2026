import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { VacunaService } from './vacuna.service';
import { CreateVacunaDto } from './dto/create-vacuna.dto';
import { UpdateVacunaDto } from './dto/update-vacuna.dto';

@Controller('vacuna')
export class VacunaController {
  constructor(private readonly vacunaservice: VacunaService) {}

  @Post()
  create(@Body() payload: CreateVacunaDto) {
    return this.vacunaservice.create(payload);
  }

  @Get()
  findAll() {
    return this.vacunaservice.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vacunaservice.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: UpdateVacunaDto) {
    return this.vacunaservice.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.vacunaservice.remove(id);
  }
}

