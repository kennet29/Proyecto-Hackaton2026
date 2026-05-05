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
import { CreateInstitucionmedicamentoDto } from './dto/create-institucionmedicamento.dto';
import { UpdateInstitucionmedicamentoDto } from './dto/update-institucionmedicamento.dto';
import { InstitucionmedicamentoService } from './institucionmedicamento.service';

@Controller('institucionmedicamento')
export class InstitucionmedicamentoController {
  constructor(
    private readonly institucionMedicamentoService: InstitucionmedicamentoService,
  ) {}

  @Post()
  create(@Body() payload: CreateInstitucionmedicamentoDto) {
    return this.institucionMedicamentoService.create(payload);
  }

  @Get()
  findAll(
    @Query('institucionSaludId') institucionSaludId?: string,
    @Query('medicamentoRaroId') medicamentoRaroId?: string,
    @Query('disponibilidad') disponibilidad?: string,
  ) {
    return this.institucionMedicamentoService.findAll({
      institucionSaludId: this.parseOptionalNumber(institucionSaludId, 'institucionSaludId'),
      medicamentoRaroId: this.parseOptionalNumber(medicamentoRaroId, 'medicamentoRaroId'),
      disponibilidad,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.institucionMedicamentoService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateInstitucionmedicamentoDto,
  ) {
    return this.institucionMedicamentoService.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.institucionMedicamentoService.remove(id);
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
}
