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
import { CreateMedicamentoraroDto } from "./dto/create-medicamentoraro.dto";
import { UpdateMedicamentoraroDto } from "./dto/update-medicamentoraro.dto";
import { MedicamentoraroService } from "./medicamentoraro.service";

/**
 * Expone los endpoints HTTP del dominio medicamentoraro.
 */
@Controller("medicamentoraro")
export class MedicamentoraroController {
  constructor(
    private readonly medicamentoRaroService: MedicamentoraroService,
  ) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  @Post()
  create(@Body() payload: CreateMedicamentoraroDto) {
    return this.medicamentoRaroService.create(payload);
  }

  /**
   * Find all.
   * @param activoParam Valor del parámetro `activoParam`.
   * @param requiereRecetaParam Valor del parámetro `requiereRecetaParam`.
   * @param controladoParam Valor del parámetro `controladoParam`.
   * @returns Colección de registros encontrados.
   */
  @Get()
  findAll(
    @Query("activo") activoParam?: string,
    @Query("requiereReceta") requiereRecetaParam?: string,
    @Query("controlado") controladoParam?: string,
  ) {
    return this.medicamentoRaroService.findAll({
      activo: this.parseOptionalBoolean(activoParam, "activo"),
      requiereReceta: this.parseOptionalBoolean(
        requiereRecetaParam,
        "requiereReceta",
      ),
      controlado: this.parseOptionalBoolean(controladoParam, "controlado"),
    });
  }

  /**
   * Find one.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.medicamentoRaroService.findOne(id);
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
    @Body() payload: UpdateMedicamentoraroDto,
  ) {
    return this.medicamentoRaroService.update(id, payload);
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.medicamentoRaroService.remove(id);
  }

  /**
   * Interpreta optional boolean.
   * @param value Valor de entrada que se debe transformar o validar.
   * @param field Valor del parámetro `field`.
   * @returns Valor interpretado a partir de la entrada recibida.
   */
  private parseOptionalBoolean(value: string | undefined, field: string) {
    if (value === undefined) {
      return undefined;
    }
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1") {
      return true;
    }
    if (normalized === "false" || normalized === "0") {
      return false;
    }
    throw new BadRequestException(`${field} debe ser booleano`);
  }
}
