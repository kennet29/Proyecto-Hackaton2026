import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthenticatedUser } from '../../auth/auth.service';
import { PacienteAccessService } from '../../auth/paciente-access.service';
import { CreateSaludmentalDto } from './dto/create-saludmental.dto';
import { UpdateSaludmentalHabitosDto } from './dto/update-saludmental-habitos.dto';
import { UpdateSaludmentalRegistroDiarioDto } from './dto/update-saludmental-registro-diario.dto';
import { UpdateSaludmentalDto } from './dto/update-saludmental.dto';
import { SaludmentalService } from './saludmental.service';

@Controller('salud-mental')
export class SaludmentalController {
  constructor(
    private readonly saludmentalService: SaludmentalService,
    private readonly pacienteAccessService: PacienteAccessService,
  ) {}

  @Post()
  create(@Body() payload: CreateSaludmentalDto) {
    return this.saludmentalService.create(payload);
  }

  @Get()
  async findAll(
    @Query('pacienteId') pacienteIdParam: string | undefined,
    @Req() req: Request,
  ) {
    const user = req.user as AuthenticatedUser;
    const role = user?.role?.toLowerCase();
    if (!pacienteIdParam) {
      if (role === 'admin' || role === 'superadmin') {
        return this.saludmentalService.findAll();
      }
      throw new BadRequestException('debes indicar un pacienteId para consultar salud mental');
    }

    const pacienteId = Number(pacienteIdParam);
    if (Number.isNaN(pacienteId)) {
      throw new BadRequestException('pacienteId debe ser numerico');
    }
    await this.pacienteAccessService.assertAccess(user, pacienteId);
    const historial = await this.saludmentalService.getHistorial(pacienteId);
    return historial.historialPorFecha;
  }

  @Get('paciente/:pacienteId/historial')
  async getHistorial(
    @Param('pacienteId', ParseIntPipe) pacienteId: number,
    @Req() req: Request,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    await this.pacienteAccessService.assertAccess(
      req.user as AuthenticatedUser,
      pacienteId,
    );
    return this.saludmentalService.getHistorial(pacienteId, desde, hasta);
  }

  @Get('paciente/:pacienteId/estadisticas')
  async getEstadisticas(
    @Param('pacienteId', ParseIntPipe) pacienteId: number,
    @Req() req: Request,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    await this.pacienteAccessService.assertAccess(
      req.user as AuthenticatedUser,
      pacienteId,
    );
    return this.saludmentalService.getEstadisticas(pacienteId, desde, hasta);
  }

  @Get('paciente/:pacienteId/alertas')
  async getAlertas(
    @Param('pacienteId', ParseIntPipe) pacienteId: number,
    @Req() req: Request,
  ) {
    await this.pacienteAccessService.assertAccess(
      req.user as AuthenticatedUser,
      pacienteId,
    );
    return this.saludmentalService.getAlertas(pacienteId);
  }

  @Get('paciente/:pacienteId/reporte-medico')
  async getReporteMedico(
    @Param('pacienteId', ParseIntPipe) pacienteId: number,
    @Req() req: Request,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('formato') formato?: string,
  ) {
    await this.pacienteAccessService.assertAccess(
      req.user as AuthenticatedUser,
      pacienteId,
    );
    return this.saludmentalService.getReporteMedico(
      pacienteId,
      desde,
      hasta,
      formato,
    );
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const record = await this.saludmentalService.findOne(id);
    await this.pacienteAccessService.assertAccess(
      req.user as AuthenticatedUser,
      record.pacienteId,
    );
    return record;
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
