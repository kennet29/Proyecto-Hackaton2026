import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { UsuariorolService } from './usuariorol.service';
import { CreateUsuariorolDto } from './dto/create-usuariorol.dto';
import { UpdateUsuariorolDto } from './dto/update-usuariorol.dto';

@Controller('usuariorol')
export class UsuariorolController {
  constructor(private readonly usuariorolservice: UsuariorolService) {}

  @Post()
  create(@Body() payload: CreateUsuariorolDto) {
    return this.usuariorolservice.create(payload);
  }

  @Get()
  findAll() {
    return this.usuariorolservice.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usuariorolservice.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: UpdateUsuariorolDto) {
    return this.usuariorolservice.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usuariorolservice.remove(id);
  }
}

