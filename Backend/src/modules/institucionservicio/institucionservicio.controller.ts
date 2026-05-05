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
import { CreateInstitucionservicioDto } from './dto/create-institucionservicio.dto';
import { UpdateInstitucionservicioDto } from './dto/update-institucionservicio.dto';
import { InstitucionservicioService } from './institucionservicio.service';

@Controller('institucionservicio')
export class InstitucionservicioController {
  constructor(private readonly institucionServicioService: InstitucionservicioService) {}

  @Post()
  create(@Body() payload: CreateInstitucionservicioDto) {
    return this.institucionServicioService.create(payload);
  }

  @Get()
  findAll(
    @Query('institucionSaludId') institucionSaludId?: string,
    @Query('catalogoServicioId') catalogoServicioId?: string,
    @Query('disponible') disponibleParam?: string,
  ) {
    return this.institucionServicioService.findAll({
      institucionSaludId: this.parseOptionalNumber(institucionSaludId, 'institucionSaludId'),
      catalogoServicioId: this.parseOptionalNumber(catalogoServicioId, 'catalogoServicioId'),
      disponible: this.parseOptionalBoolean(disponibleParam, 'disponible'),
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.institucionServicioService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateInstitucionservicioDto,
  ) {
    return this.institucionServicioService.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.institucionServicioService.remove(id);
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
