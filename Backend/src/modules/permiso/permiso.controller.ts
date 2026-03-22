import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { PermisoService } from './permiso.service';
import { CreatePermisoDto } from './dto/create-permiso.dto';
import { UpdatePermisoDto } from './dto/update-permiso.dto';

@Controller('permiso')
export class PermisoController {
  constructor(private readonly permisoservice: PermisoService) {}

  @Post()
  create(@Body() payload: CreatePermisoDto) {
    return this.permisoservice.create(payload);
  }

  @Get()
  findAll() {
    return this.permisoservice.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.permisoservice.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: UpdatePermisoDto) {
    return this.permisoservice.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.permisoservice.remove(id);
  }
}

