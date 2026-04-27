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
import { CreatePeriodoDto } from './dto/create-periodo.dto';
import { RegisterPeriodoSintomasDto } from './dto/register-periodo-sintomas.dto';
import { UpdatePeriodoDto } from './dto/update-periodo.dto';
import { PeriodoService } from './periodo.service';

@Controller('periodo')
export class PeriodoController {
  constructor(private readonly periodoService: PeriodoService) {}

  @Post()
  create(@Body() payload: CreatePeriodoDto) {
    return this.periodoService.create(payload);
  }

  @Get()
  findAll() {
    return this.periodoService.findAll();
  }

  @Get('calendario/:pacienteId')
  getCalendar(
    @Param('pacienteId', ParseIntPipe) pacienteId: number,
    @Query('mes') mes?: string,
    @Query('anio') anio?: string,
  ) {
    return this.periodoService.getCalendar(
      pacienteId,
      mes ? Number(mes) : undefined,
      anio ? Number(anio) : undefined,
    );
  }

  @Get('paciente/:pacienteId/historial')
  getHistorial(@Param('pacienteId', ParseIntPipe) pacienteId: number) {
    return this.periodoService.getHistorial(pacienteId);
  }

  @Get('paciente/:pacienteId/prediccion')
  getPrediction(@Param('pacienteId', ParseIntPipe) pacienteId: number) {
    return this.periodoService.getPrediction(pacienteId);
  }

  @Get('paciente/:pacienteId/reporte-medico')
  getMedicalReport(@Param('pacienteId', ParseIntPipe) pacienteId: number) {
    return this.periodoService.getMedicalReport(pacienteId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.periodoService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdatePeriodoDto,
  ) {
    return this.periodoService.update(id, payload);
  }

  @Patch(':id/sintomas')
  registerSymptoms(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: RegisterPeriodoSintomasDto,
  ) {
    return this.periodoService.registerSymptoms(id, payload);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.periodoService.remove(id);
  }
}
