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
import { CatalogoservicioService } from "./catalogoservicio.service";
import { CreateCatalogoservicioDto } from "./dto/create-catalogoservicio.dto";
import { UpdateCatalogoservicioDto } from "./dto/update-catalogoservicio.dto";

/**
 * Expone los endpoints HTTP del dominio catalogoservicio.
 */
@Controller("catalogoservicio")
export class CatalogoservicioController {
  constructor(
    private readonly catalogoServicioService: CatalogoservicioService,
  ) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  @Post()
  create(@Body() payload: CreateCatalogoservicioDto) {
    return this.catalogoServicioService.create(payload);
  }

  /**
   * Find all.
   * @param categoria Valor del parámetro `categoria`.
   * @param activoParam Valor del parámetro `activoParam`.
   * @returns Colección de registros encontrados.
   */
  @Get()
  findAll(
    @Query("categoria") categoria?: string,
    @Query("activo") activoParam?: string,
  ) {
    return this.catalogoServicioService.findAll({
      categoria,
      activo: this.parseOptionalBoolean(activoParam, "activo"),
    });
  }

  /**
   * Find one.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.catalogoServicioService.findOne(id);
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
    @Body() payload: UpdateCatalogoservicioDto,
  ) {
    return this.catalogoServicioService.update(id, payload);
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.catalogoServicioService.remove(id);
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
