import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { RegistromensualService } from './registromensual.service';
import { CreateRegistromensualDto } from './dto/create-registromensual.dto';
import { UpdateRegistromensualDto } from './dto/update-registromensual.dto';

@Controller('registromensual')
export class RegistromensualController {
  constructor(private readonly registromensualservice: RegistromensualService) {}

  @Post()
  create(@Body() payload: CreateRegistromensualDto) {
    return this.registromensualservice.create(payload);
  }

  @Get()
  findAll() {
    return this.registromensualservice.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.registromensualservice.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: UpdateRegistromensualDto) {
    return this.registromensualservice.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.registromensualservice.remove(id);
  }
}

