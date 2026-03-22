import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { HabitoespecificoService } from './habitoespecifico.service';
import { CreateHabitoespecificoDto } from './dto/create-habitoespecifico.dto';
import { UpdateHabitoespecificoDto } from './dto/update-habitoespecifico.dto';

@Controller('habitoespecifico')
export class HabitoespecificoController {
  constructor(private readonly habitoespecificoservice: HabitoespecificoService) {}

  @Post()
  create(@Body() payload: CreateHabitoespecificoDto) {
    return this.habitoespecificoservice.create(payload);
  }

  @Get()
  findAll() {
    return this.habitoespecificoservice.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.habitoespecificoservice.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: UpdateHabitoespecificoDto) {
    return this.habitoespecificoservice.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.habitoespecificoservice.remove(id);
  }
}

