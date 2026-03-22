import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { TipovacunaService } from './tipovacuna.service';
import { CreateTipovacunaDto } from './dto/create-tipovacuna.dto';
import { UpdateTipovacunaDto } from './dto/update-tipovacuna.dto';

@Controller('tipovacuna')
export class TipovacunaController {
  constructor(private readonly tipovacunaservice: TipovacunaService) {}

  @Post()
  create(@Body() payload: CreateTipovacunaDto) {
    return this.tipovacunaservice.create(payload);
  }

  @Get()
  findAll() {
    return this.tipovacunaservice.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tipovacunaservice.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: UpdateTipovacunaDto) {
    return this.tipovacunaservice.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tipovacunaservice.remove(id);
  }
}

