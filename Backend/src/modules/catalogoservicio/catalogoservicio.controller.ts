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
import { CatalogoservicioService } from './catalogoservicio.service';
import { CreateCatalogoservicioDto } from './dto/create-catalogoservicio.dto';
import { UpdateCatalogoservicioDto } from './dto/update-catalogoservicio.dto';

@Controller('catalogoservicio')
export class CatalogoservicioController {
  constructor(private readonly catalogoServicioService: CatalogoservicioService) {}

  @Post()
  create(@Body() payload: CreateCatalogoservicioDto) {
    return this.catalogoServicioService.create(payload);
  }

  @Get()
  findAll(
    @Query('categoria') categoria?: string,
    @Query('activo') activoParam?: string,
  ) {
    return this.catalogoServicioService.findAll({
      categoria,
      activo: this.parseOptionalBoolean(activoParam, 'activo'),
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.catalogoServicioService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateCatalogoservicioDto,
  ) {
    return this.catalogoServicioService.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.catalogoServicioService.remove(id);
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
