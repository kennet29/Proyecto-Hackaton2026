import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { CreateExamenclinicoDto } from './dto/create-examenclinico.dto';
import { UpdateExamenclinicoDto } from './dto/update-examenclinico.dto';
import { ExamenclinicoService } from './examenclinico.service';

@Controller('examenclinico')
export class ExamenclinicoController {
  constructor(private readonly examenclinicoService: ExamenclinicoService) {}

  @Post()
  create(@Body() payload: CreateExamenclinicoDto) {
    return this.examenclinicoService.create(payload);
  }

  @Get()
  findAll(@Query('pacienteId') pacienteId?: string) {
    return this.examenclinicoService.findAll(pacienteId ? Number(pacienteId) : undefined);
  }

  @Get(':id/documento')
  getDocumento(@Param('id', ParseIntPipe) id: number) {
    return this.examenclinicoService.getDocumento(id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.examenclinicoService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() payload: UpdateExamenclinicoDto) {
    return this.examenclinicoService.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.examenclinicoService.remove(id);
  }
}
