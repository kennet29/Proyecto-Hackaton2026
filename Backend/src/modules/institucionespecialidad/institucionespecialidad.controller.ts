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
import { CreateInstitucionespecialidadDto } from "./dto/create-institucionespecialidad.dto";
import { UpdateInstitucionespecialidadDto } from "./dto/update-institucionespecialidad.dto";
import { InstitucionespecialidadService } from "./institucionespecialidad.service";

/**
 * Expone los endpoints HTTP del dominio institucionespecialidad.
 */
@Controller("institucionespecialidad")
export class InstitucionespecialidadController {
  constructor(
    private readonly institucionEspecialidadService: InstitucionespecialidadService,
  ) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  @Post()
  create(@Body() payload: CreateInstitucionespecialidadDto) {
    return this.institucionEspecialidadService.create(payload);
  }

  /**
   * Find all.
   * @param institucionSaludId Identificador asociado a institucion salud.
   * @param especialidadId Identificador asociado a especialidad.
   * @param activo Valor del parámetro `activo`.
   * @param destacada Valor del parámetro `destacada`.
   * @returns Colección de registros encontrados.
   */
  @Get()
  findAll(
    @Query("institucionSaludId") institucionSaludId?: string,
    @Query("especialidadId") especialidadId?: string,
    @Query("activo") activo?: string,
    @Query("destacada") destacada?: string,
  ) {
    return this.institucionEspecialidadService.findAll({
      institucionSaludId: this.parseOptionalNumber(
        institucionSaludId,
        "institucionSaludId",
      ),
      especialidadId: this.parseOptionalNumber(
        especialidadId,
        "especialidadId",
      ),
      activo: this.parseOptionalBoolean(activo, "activo"),
      destacada: this.parseOptionalBoolean(destacada, "destacada"),
    });
  }

  /**
   * Find one.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.institucionEspecialidadService.findOne(id);
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
    @Body() payload: UpdateInstitucionespecialidadDto,
  ) {
    return this.institucionEspecialidadService.update(id, payload);
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.institucionEspecialidadService.remove(id);
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
