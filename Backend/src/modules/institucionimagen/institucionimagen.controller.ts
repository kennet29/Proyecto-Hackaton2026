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
import { CreateInstitucionimagenDto } from './dto/create-institucionimagen.dto';
import { UpdateInstitucionimagenDto } from './dto/update-institucionimagen.dto';
import { InstitucionimagenService } from './institucionimagen.service';

@Controller('institucionimagen')
export class InstitucionimagenController {
  constructor(private readonly institucionImagenService: InstitucionimagenService) {}

  @Post()
  create(@Body() payload: CreateInstitucionimagenDto) {
    return this.institucionImagenService.create(payload);
  }

  @Get()
  findAll(
    @Query('institucionSaludId') institucionSaludId?: string,
    @Query('activo') activoParam?: string,
    @Query('tipoImagen') tipoImagen?: string,
  ) {
    return this.institucionImagenService.findAll({
      institucionSaludId: this.parseOptionalNumber(institucionSaludId, 'institucionSaludId'),
      activo: this.parseOptionalBoolean(activoParam, 'activo'),
      tipoImagen,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.institucionImagenService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateInstitucionimagenDto,
  ) {
    return this.institucionImagenService.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.institucionImagenService.remove(id);
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
