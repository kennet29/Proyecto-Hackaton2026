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
} from "@nestjs/common";
import { CreateInstitucionmedicamentoDto } from "./dto/create-institucionmedicamento.dto";
import { UpdateInstitucionmedicamentoDto } from "./dto/update-institucionmedicamento.dto";
import { InstitucionmedicamentoService } from "./institucionmedicamento.service";

/**
 * Expone los endpoints HTTP del dominio institucionmedicamento.
 */
@Controller("institucionmedicamento")
export class InstitucionmedicamentoController {
  constructor(
    private readonly institucionMedicamentoService: InstitucionmedicamentoService,
  ) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  @Post()
  create(@Body() payload: CreateInstitucionmedicamentoDto) {
    return this.institucionMedicamentoService.create(payload);
  }

  /**
   * Find all.
   * @param institucionSaludId Identificador asociado a institucion salud.
   * @param medicamentoRaroId Identificador asociado a medicamento raro.
   * @param disponibilidad Valor del parámetro `disponibilidad`.
   * @returns Colección de registros encontrados.
   */
  @Get()
  findAll(
    @Query("institucionSaludId") institucionSaludId?: string,
    @Query("medicamentoRaroId") medicamentoRaroId?: string,
    @Query("disponibilidad") disponibilidad?: string,
  ) {
    return this.institucionMedicamentoService.findAll({
      institucionSaludId: this.parseOptionalNumber(
        institucionSaludId,
        "institucionSaludId",
      ),
      medicamentoRaroId: this.parseOptionalNumber(
        medicamentoRaroId,
        "medicamentoRaroId",
      ),
      disponibilidad,
    });
  }

  /**
   * Find one.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.institucionMedicamentoService.findOne(id);
  }

  /**
   * Update.
   * @param id Identificador del registro objetivo.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro actualizado.
   */
  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() payload: UpdateInstitucionmedicamentoDto,
  ) {
    return this.institucionMedicamentoService.update(id, payload);
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.institucionMedicamentoService.remove(id);
  }

  /**
   * Interpreta optional number.
   * @param value Valor de entrada que se debe transformar o validar.
   * @param field Valor del parámetro `field`.
   * @returns Valor interpretado a partir de la entrada recibida.
   */
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
