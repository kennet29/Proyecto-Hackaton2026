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
import { CreateSaludmentalDto } from './dto/create-saludmental.dto';
import { UpdateSaludmentalHabitosDto } from './dto/update-saludmental-habitos.dto';
import { UpdateSaludmentalRegistroDiarioDto } from './dto/update-saludmental-registro-diario.dto';
import { UpdateSaludmentalDto } from './dto/update-saludmental.dto';
import { SaludmentalService } from './saludmental.service';

@Controller('salud-mental')
export class SaludmentalController {
  constructor(private readonly saludmentalService: SaludmentalService) {}

  @Post()
  create(@Body() payload: CreateSaludmentalDto) {
    return this.saludmentalService.create(payload);
  }

  @Get()
  findAll() {
    return this.saludmentalService.findAll();
  }

  @Get('paciente/:pacienteId/historial')
  getHistorial(
    @Param('pacienteId', ParseIntPipe) pacienteId: number,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return this.saludmentalService.getHistorial(pacienteId, desde, hasta);
  }

  @Get('paciente/:pacienteId/estadisticas')
  getEstadisticas(
    @Param('pacienteId', ParseIntPipe) pacienteId: number,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return this.saludmentalService.getEstadisticas(pacienteId, desde, hasta);
  }

  @Get('paciente/:pacienteId/alertas')
  getAlertas(@Param('pacienteId', ParseIntPipe) pacienteId: number) {
    return this.saludmentalService.getAlertas(pacienteId);
  }

  @Get('paciente/:pacienteId/reporte-medico')
  getReporteMedico(
    @Param('pacienteId', ParseIntPipe) pacienteId: number,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('formato') formato?: string,
  ) {
    return this.saludmentalService.getReporteMedico(
      pacienteId,
      desde,
      hasta,
      formato,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.saludmentalService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateSaludmentalDto,
  ) {
    return this.saludmentalService.update(id, payload);
  }

  @Patch(':id/registro-diario')
  updateRegistroDiario(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateSaludmentalRegistroDiarioDto,
  ) {
    return this.saludmentalService.updateRegistroDiario(id, payload);
  }

  @Patch(':id/habitos')
  updateHabitos(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateSaludmentalHabitosDto,
  ) {
    return this.saludmentalService.updateHabitos(id, payload);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.saludmentalService.remove(id);
  }
}
