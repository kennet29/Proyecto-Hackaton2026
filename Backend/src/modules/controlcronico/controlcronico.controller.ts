import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ControlcronicoService } from './controlcronico.service';
import { CreateControlcronicoDto } from './dto/create-controlcronico.dto';
import { UpdateControlcronicoDto } from './dto/update-controlcronico.dto';

@Controller('controlcronico')
export class ControlcronicoController {
  constructor(private readonly controlcronicoservice: ControlcronicoService) {}

  @Post()
  create(@Body() payload: CreateControlcronicoDto) {
    return this.controlcronicoservice.create(payload);
  }

  @Get()
  findAll() {
    return this.controlcronicoservice.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.controlcronicoservice.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: UpdateControlcronicoDto) {
    return this.controlcronicoservice.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.controlcronicoservice.remove(id);
  }
}

