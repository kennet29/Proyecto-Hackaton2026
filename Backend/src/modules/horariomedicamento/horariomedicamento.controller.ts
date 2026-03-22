import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { HorariomedicamentoService } from './horariomedicamento.service';
import { CreateHorariomedicamentoDto } from './dto/create-horariomedicamento.dto';
import { UpdateHorariomedicamentoDto } from './dto/update-horariomedicamento.dto';

@Controller('horariomedicamento')
export class HorariomedicamentoController {
  constructor(private readonly horariomedicamentoservice: HorariomedicamentoService) {}

  @Post()
  create(@Body() payload: CreateHorariomedicamentoDto) {
    return this.horariomedicamentoservice.create(payload);
  }

  @Get()
  findAll() {
    return this.horariomedicamentoservice.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.horariomedicamentoservice.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: UpdateHorariomedicamentoDto) {
    return this.horariomedicamentoservice.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.horariomedicamentoservice.remove(id);
  }
}

