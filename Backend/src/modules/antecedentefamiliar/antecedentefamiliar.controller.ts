import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { AntecedentefamiliarService } from './antecedentefamiliar.service';
import { CreateAntecedentefamiliarDto } from './dto/create-antecedentefamiliar.dto';
import { UpdateAntecedentefamiliarDto } from './dto/update-antecedentefamiliar.dto';

@Controller('antecedentefamiliar')
export class AntecedentefamiliarController {
  constructor(private readonly antecedentefamiliarservice: AntecedentefamiliarService) {}

  @Post()
  create(@Body() payload: CreateAntecedentefamiliarDto) {
    return this.antecedentefamiliarservice.create(payload);
  }

  @Get()
  findAll() {
    return this.antecedentefamiliarservice.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.antecedentefamiliarservice.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: UpdateAntecedentefamiliarDto) {
    return this.antecedentefamiliarservice.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.antecedentefamiliarservice.remove(id);
  }
}

