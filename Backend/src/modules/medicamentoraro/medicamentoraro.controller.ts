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
import { CreateMedicamentoraroDto } from './dto/create-medicamentoraro.dto';
import { UpdateMedicamentoraroDto } from './dto/update-medicamentoraro.dto';
import { MedicamentoraroService } from './medicamentoraro.service';

@Controller('medicamentoraro')
export class MedicamentoraroController {
  constructor(private readonly medicamentoRaroService: MedicamentoraroService) {}

  @Post()
  create(@Body() payload: CreateMedicamentoraroDto) {
    return this.medicamentoRaroService.create(payload);
  }

  @Get()
  findAll(
    @Query('activo') activoParam?: string,
    @Query('requiereReceta') requiereRecetaParam?: string,
    @Query('controlado') controladoParam?: string,
  ) {
    return this.medicamentoRaroService.findAll({
      activo: this.parseOptionalBoolean(activoParam, 'activo'),
      requiereReceta: this.parseOptionalBoolean(requiereRecetaParam, 'requiereReceta'),
      controlado: this.parseOptionalBoolean(controladoParam, 'controlado'),
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.medicamentoRaroService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateMedicamentoraroDto,
  ) {
    return this.medicamentoRaroService.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.medicamentoRaroService.remove(id);
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
