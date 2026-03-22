import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

@Controller('usuario')
export class UsuarioController {
  constructor(private readonly usuarioservice: UsuarioService) {}

  @Post()
  create(@Body() payload: CreateUsuarioDto) {
    return this.usuarioservice.create(payload);
  }

  @Get()
  findAll() {
    return this.usuarioservice.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usuarioservice.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: UpdateUsuarioDto) {
    return this.usuarioservice.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usuarioservice.remove(id);
  }
}

