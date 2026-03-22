import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { TipooperacionService } from './tipooperacion.service';
import { CreateTipooperacionDto } from './dto/create-tipooperacion.dto';
import { UpdateTipooperacionDto } from './dto/update-tipooperacion.dto';

@Controller('tipooperacion')
export class TipooperacionController {
  constructor(private readonly tipooperacionservice: TipooperacionService) {}

  @Post()
  create(@Body() payload: CreateTipooperacionDto) {
    return this.tipooperacionservice.create(payload);
  }

  @Get()
  findAll() {
    return this.tipooperacionservice.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tipooperacionservice.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: UpdateTipooperacionDto) {
    return this.tipooperacionservice.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tipooperacionservice.remove(id);
  }
}

