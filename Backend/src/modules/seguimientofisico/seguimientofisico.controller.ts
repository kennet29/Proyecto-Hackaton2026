import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateSeguimientofisicoDto } from './dto/create-seguimientofisico.dto';
import { UpdateSeguimientofisicoDto } from './dto/update-seguimientofisico.dto';
import { SeguimientofisicoService } from './seguimientofisico.service';

@Controller('seguimientofisico')
export class SeguimientofisicoController {
  constructor(private readonly seguimientoFisicoService: SeguimientofisicoService) {}

  @Post()
  create(@Body() payload: CreateSeguimientofisicoDto) {
    return this.seguimientoFisicoService.create(payload);
  }

  @Get()
  findAll(
    @Query('pacienteId') pacienteId?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return this.seguimientoFisicoService.findAll(
      pacienteId ? Number(pacienteId) : undefined,
      desde,
      hasta,
    );
  }

  @Get('paciente/:pacienteId/historial')
  getHistorial(
    @Param('pacienteId', ParseIntPipe) pacienteId: number,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return this.seguimientoFisicoService.getHistorial(pacienteId, desde, hasta);
  }

  @Get('paciente/:pacienteId/resumen')
  getResumen(
    @Param('pacienteId', ParseIntPipe) pacienteId: number,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return this.seguimientoFisicoService.getResumen(pacienteId, desde, hasta);
  }

  @Get('paciente/:pacienteId/progreso-peso')
  getPesoProgress(
    @Param('pacienteId', ParseIntPipe) pacienteId: number,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return this.seguimientoFisicoService.getPesoProgress(pacienteId, desde, hasta);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.seguimientoFisicoService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateSeguimientofisicoDto,
  ) {
    return this.seguimientoFisicoService.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.seguimientoFisicoService.remove(id);
  }
}
