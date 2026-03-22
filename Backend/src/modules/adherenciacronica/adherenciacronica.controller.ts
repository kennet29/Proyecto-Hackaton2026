import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { AdherenciacronicaService } from './adherenciacronica.service';
import { CreateAdherenciacronicaDto } from './dto/create-adherenciacronica.dto';
import { UpdateAdherenciacronicaDto } from './dto/update-adherenciacronica.dto';

@Controller('adherenciacronica')
export class AdherenciacronicaController {
  constructor(private readonly adherenciacronicaservice: AdherenciacronicaService) {}

  @Post()
  create(@Body() payload: CreateAdherenciacronicaDto) {
    return this.adherenciacronicaservice.create(payload);
  }

  @Get()
  findAll() {
    return this.adherenciacronicaservice.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adherenciacronicaservice.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: UpdateAdherenciacronicaDto) {
    return this.adherenciacronicaservice.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.adherenciacronicaservice.remove(id);
  }
}

