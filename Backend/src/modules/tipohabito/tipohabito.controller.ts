import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { TipohabitoService } from './tipohabito.service';
import { CreateTipohabitoDto } from './dto/create-tipohabito.dto';
import { UpdateTipohabitoDto } from './dto/update-tipohabito.dto';

@Controller('tipohabito')
export class TipohabitoController {
  constructor(private readonly tipohabitoservice: TipohabitoService) {}

  @Post()
  create(@Body() payload: CreateTipohabitoDto) {
    return this.tipohabitoservice.create(payload);
  }

  @Get()
  findAll() {
    return this.tipohabitoservice.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tipohabitoservice.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: UpdateTipohabitoDto) {
    return this.tipohabitoservice.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tipohabitoservice.remove(id);
  }
}

