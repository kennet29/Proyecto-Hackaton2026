import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { RolpermisoService } from './rolpermiso.service';
import { CreateRolpermisoDto } from './dto/create-rolpermiso.dto';
import { UpdateRolpermisoDto } from './dto/update-rolpermiso.dto';

@Controller('rolpermiso')
export class RolpermisoController {
  constructor(private readonly rolpermisoservice: RolpermisoService) {}

  @Post()
  create(@Body() payload: CreateRolpermisoDto) {
    return this.rolpermisoservice.create(payload);
  }

  @Get()
  findAll() {
    return this.rolpermisoservice.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rolpermisoservice.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: UpdateRolpermisoDto) {
    return this.rolpermisoservice.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rolpermisoservice.remove(id);
  }
}

