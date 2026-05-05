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
} from '@nestjs/common';
import { CreateInstitucionespecialidadDto } from './dto/create-institucionespecialidad.dto';
import { UpdateInstitucionespecialidadDto } from './dto/update-institucionespecialidad.dto';
import { InstitucionespecialidadService } from './institucionespecialidad.service';

@Controller('institucionespecialidad')
export class InstitucionespecialidadController {
  constructor(private readonly institucionEspecialidadService: InstitucionespecialidadService) {}

  @Post()
  create(@Body() payload: CreateInstitucionespecialidadDto) {
    return this.institucionEspecialidadService.create(payload);
  }

  @Get()
  findAll(
    @Query('institucionSaludId') institucionSaludId?: string,
    @Query('especialidadId') especialidadId?: string,
    @Query('activo') activo?: string,
    @Query('destacada') destacada?: string,
  ) {
    return this.institucionEspecialidadService.findAll({
      institucionSaludId: this.parseOptionalNumber(institucionSaludId, 'institucionSaludId'),
      especialidadId: this.parseOptionalNumber(especialidadId, 'especialidadId'),
      activo: this.parseOptionalBoolean(activo, 'activo'),
      destacada: this.parseOptionalBoolean(destacada, 'destacada'),
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.institucionEspecialidadService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateInstitucionespecialidadDto,
  ) {
    return this.institucionEspecialidadService.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.institucionEspecialidadService.remove(id);
  }

  private parseOptionalNumber(value: string | undefined, field: string) {
    if (value === undefined) {
      return undefined;
    }
    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
      throw new BadRequestException(`${field} debe ser numerico`);
    }
    return parsed;
  }

  private parseOptionalBoolean(value: string | undefined, field: string) {
    if (value === undefined) {
      return undefined;
    }
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') {
      return true;
    }
    if (normalized === 'false' || normalized === '0') {
      return false;
    }
    throw new BadRequestException(`${field} debe ser booleano`);
  }
}
