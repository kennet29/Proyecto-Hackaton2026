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
import { CreateInstitucionhorarioDto } from './dto/create-institucionhorario.dto';
import { UpdateInstitucionhorarioDto } from './dto/update-institucionhorario.dto';
import { InstitucionhorarioService } from './institucionhorario.service';

@Controller('institucionhorario')
export class InstitucionhorarioController {
  constructor(private readonly horarioService: InstitucionhorarioService) {}

  @Post()
  create(@Body() payload: CreateInstitucionhorarioDto) {
    return this.horarioService.create(payload);
  }

  @Get()
  findAll(
    @Query('institucionSaludId') institucionSaludId?: string,
    @Query('diaSemana') diaSemana?: string,
    @Query('activo') activo?: string,
  ) {
    return this.horarioService.findAll({
      institucionSaludId: this.parseOptionalNumber(institucionSaludId, 'institucionSaludId'),
      diaSemana: this.parseOptionalNumber(diaSemana, 'diaSemana'),
      activo: this.parseOptionalBoolean(activo, 'activo'),
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.horarioService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateInstitucionhorarioDto,
  ) {
    return this.horarioService.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.horarioService.remove(id);
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
