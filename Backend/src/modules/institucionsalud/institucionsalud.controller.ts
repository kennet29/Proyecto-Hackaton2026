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
import { CreateInstitucionsaludDto } from './dto/create-institucionsalud.dto';
import { UpdateInstitucionsaludDto } from './dto/update-institucionsalud.dto';
import { InstitucionsaludService } from './institucionsalud.service';

@Controller('institucionsalud')
export class InstitucionsaludController {
  constructor(private readonly institucionService: InstitucionsaludService) {}

  @Post()
  create(@Body() payload: CreateInstitucionsaludDto) {
    return this.institucionService.create(payload);
  }

  @Get()
  findAll(
    @Query('q') q?: string,
    @Query('tipo') tipo?: string,
    @Query('ciudad') ciudad?: string,
    @Query('departamento') departamento?: string,
    @Query('activo') activoParam?: string,
    @Query('conUbicacion') conUbicacionParam?: string,
    @Query('especialidadId') especialidadIdParam?: string,
    @Query('latMin') latMinParam?: string,
    @Query('latMax') latMaxParam?: string,
    @Query('lngMin') lngMinParam?: string,
    @Query('lngMax') lngMaxParam?: string,
  ) {
    return this.institucionService.findAll({
      q,
      tipo,
      ciudad,
      departamento,
      activo: this.parseOptionalBoolean(activoParam, 'activo'),
      conUbicacion: this.parseOptionalBoolean(conUbicacionParam, 'conUbicacion'),
      especialidadId: this.parseOptionalNumber(especialidadIdParam, 'especialidadId'),
      latMin: this.parseOptionalNumber(latMinParam, 'latMin'),
      latMax: this.parseOptionalNumber(latMaxParam, 'latMax'),
      lngMin: this.parseOptionalNumber(lngMinParam, 'lngMin'),
      lngMax: this.parseOptionalNumber(lngMaxParam, 'lngMax'),
    });
  }

  @Get('cercanas')
  findNearby(
    @Query('latitud') latitudParam: string,
    @Query('longitud') longitudParam: string,
    @Query('radioKm') radioKmParam?: string,
    @Query('limit') limitParam?: string,
    @Query('tipo') tipo?: string,
    @Query('ciudad') ciudad?: string,
    @Query('departamento') departamento?: string,
    @Query('activo') activoParam?: string,
    @Query('especialidadId') especialidadIdParam?: string,
  ) {
    return this.institucionService.findNearby({
      latitud: this.parseRequiredNumber(latitudParam, 'latitud'),
      longitud: this.parseRequiredNumber(longitudParam, 'longitud'),
      radioKm: this.parseOptionalNumber(radioKmParam, 'radioKm'),
      limit: this.parseOptionalNumber(limitParam, 'limit'),
      tipo,
      ciudad,
      departamento,
      activo: this.parseOptionalBoolean(activoParam, 'activo'),
      especialidadId: this.parseOptionalNumber(especialidadIdParam, 'especialidadId'),
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.institucionService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateInstitucionsaludDto,
  ) {
    return this.institucionService.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.institucionService.remove(id);
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

  private parseRequiredNumber(value: string | undefined, field: string) {
    if (value === undefined) {
      throw new BadRequestException(`${field} es obligatorio`);
    }
    return this.parseOptionalNumber(value, field)!;
  }
}
