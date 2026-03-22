import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { OperacionService } from './operacion.service';
import { CreateOperacionDto } from './dto/create-operacion.dto';
import { UpdateOperacionDto } from './dto/update-operacion.dto';

@Controller('operacion')
export class OperacionController {
  constructor(private readonly operacionservice: OperacionService) {}

  @Post()
  create(@Body() payload: CreateOperacionDto) {
    return this.operacionservice.create(payload);
  }

  @Get()
  findAll() {
    return this.operacionservice.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.operacionservice.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: UpdateOperacionDto) {
    return this.operacionservice.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.operacionservice.remove(id);
  }
}

