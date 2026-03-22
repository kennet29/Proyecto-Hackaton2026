import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { AlergiaService } from './alergia.service';
import { CreateAlergiaDto } from './dto/create-alergia.dto';
import { UpdateAlergiaDto } from './dto/update-alergia.dto';

@Controller('alergia')
export class AlergiaController {
  constructor(private readonly alergiaservice: AlergiaService) {}

  @Post()
  create(@Body() payload: CreateAlergiaDto) {
    return this.alergiaservice.create(payload);
  }

  @Get()
  findAll() {
    return this.alergiaservice.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.alergiaservice.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: UpdateAlergiaDto) {
    return this.alergiaservice.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.alergiaservice.remove(id);
  }
}

