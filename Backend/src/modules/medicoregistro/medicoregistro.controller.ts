import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { CreateMedicoregistroDto } from './dto/create-medicoregistro.dto';
import { UpdateMedicoregistroDto } from './dto/update-medicoregistro.dto';
import { MedicoregistroService } from './medicoregistro.service';

@Controller('medicoregistro')
export class MedicoregistroController {
  constructor(private readonly medicoregistroService: MedicoregistroService) {}

  @Post()
  create(@Body() payload: CreateMedicoregistroDto) {
    return this.medicoregistroService.create(payload);
  }

  @Get()
  findAll() {
    return this.medicoregistroService.findAll();
  }

  @Get('usuario/:usuarioId')
  findByUsuario(@Param('usuarioId', ParseIntPipe) usuarioId: number) {
    return this.medicoregistroService.findByUsuario(usuarioId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.medicoregistroService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateMedicoregistroDto,
  ) {
    return this.medicoregistroService.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.medicoregistroService.remove(id);
  }
}
