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
import { CreateInstitucionhorarioDto } from "./dto/create-institucionhorario.dto";
import { UpdateInstitucionhorarioDto } from "./dto/update-institucionhorario.dto";
import { InstitucionhorarioService } from "./institucionhorario.service";

/**
 * Expone los endpoints HTTP del dominio institucionhorario.
 */
@Controller("institucionhorario")
export class InstitucionhorarioController {
  constructor(private readonly horarioService: InstitucionhorarioService) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  @Post()
  create(@Body() payload: CreateInstitucionhorarioDto) {
    return this.horarioService.create(payload);
  }

  /**
   * Find all.
   * @param institucionSaludId Identificador asociado a institucion salud.
   * @param diaSemana Valor del parámetro `diaSemana`.
   * @param activo Valor del parámetro `activo`.
   * @returns Colección de registros encontrados.
   */
  @Get()
  findAll(
    @Query("institucionSaludId") institucionSaludId?: string,
    @Query("diaSemana") diaSemana?: string,
    @Query("activo") activo?: string,
  ) {
    return this.horarioService.findAll({
      institucionSaludId: this.parseOptionalNumber(
        institucionSaludId,
        "institucionSaludId",
      ),
      diaSemana: this.parseOptionalNumber(diaSemana, "diaSemana"),
      activo: this.parseOptionalBoolean(activo, "activo"),
    });
  }

  /**
   * Find one.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.horarioService.findOne(id);
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
    @Body() payload: UpdateInstitucionhorarioDto,
  ) {
    return this.horarioService.update(id, payload);
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.horarioService.remove(id);
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
