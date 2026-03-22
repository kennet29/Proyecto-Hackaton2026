import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { RolService } from './rol.service';
import { CreateRolDto } from './dto/create-rol.dto';
import { UpdateRolDto } from './dto/update-rol.dto';

@Controller('rol')
export class RolController {
  constructor(private readonly rolservice: RolService) {}

  @Post()
  create(@Body() payload: CreateRolDto) {
    return this.rolservice.create(payload);
  }

  @Get()
  findAll() {
    return this.rolservice.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rolservice.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: UpdateRolDto) {
    return this.rolservice.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rolservice.remove(id);
  }
}

