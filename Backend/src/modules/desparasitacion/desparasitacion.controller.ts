import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { DesparasitacionService } from './desparasitacion.service';
import { CreateDesparasitacionDto } from './dto/create-desparasitacion.dto';
import { UpdateDesparasitacionDto } from './dto/update-desparasitacion.dto';

@Controller('desparasitacion')
export class DesparasitacionController {
  constructor(private readonly desparasitacionservice: DesparasitacionService) {}

  @Post()
  create(@Body() payload: CreateDesparasitacionDto) {
    return this.desparasitacionservice.create(payload);
  }

  @Get()
  findAll() {
    return this.desparasitacionservice.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.desparasitacionservice.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: UpdateDesparasitacionDto) {
    return this.desparasitacionservice.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.desparasitacionservice.remove(id);
  }
}

