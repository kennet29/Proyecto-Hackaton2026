import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { RegistrodentalService } from './registrodental.service';
import { CreateRegistrodentalDto } from './dto/create-registrodental.dto';
import { UpdateRegistrodentalDto } from './dto/update-registrodental.dto';

@Controller('registrodental')
export class RegistrodentalController {
  constructor(private readonly registrodentalservice: RegistrodentalService) {}

  @Post()
  create(@Body() payload: CreateRegistrodentalDto) {
    return this.registrodentalservice.create(payload);
  }

  @Get()
  findAll() {
    return this.registrodentalservice.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.registrodentalservice.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: UpdateRegistrodentalDto) {
    return this.registrodentalservice.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.registrodentalservice.remove(id);
  }
}

