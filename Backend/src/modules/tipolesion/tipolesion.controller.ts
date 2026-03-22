import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { TipolesionService } from './tipolesion.service';
import { CreateTipolesionDto } from './dto/create-tipolesion.dto';
import { UpdateTipolesionDto } from './dto/update-tipolesion.dto';

@Controller('tipolesion')
export class TipolesionController {
  constructor(private readonly tipolesionservice: TipolesionService) {}

  @Post()
  create(@Body() payload: CreateTipolesionDto) {
    return this.tipolesionservice.create(payload);
  }

  @Get()
  findAll() {
    return this.tipolesionservice.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tipolesionservice.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: UpdateTipolesionDto) {
    return this.tipolesionservice.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tipolesionservice.remove(id);
  }
}

