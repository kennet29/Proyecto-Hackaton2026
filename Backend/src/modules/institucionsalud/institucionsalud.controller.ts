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
import { CreateInstitucionsaludDto } from "./dto/create-institucionsalud.dto";
import { UpdateInstitucionsaludDto } from "./dto/update-institucionsalud.dto";
import { InstitucionsaludService } from "./institucionsalud.service";

/**
 * Expone los endpoints HTTP del dominio institucionsalud.
 */
@Controller("institucionsalud")
export class InstitucionsaludController {
  constructor(private readonly institucionService: InstitucionsaludService) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  @Post()
  create(@Body() payload: CreateInstitucionsaludDto) {
    return this.institucionService.create(payload);
  }

  /**
   * Find all.
   * @param q Valor del parámetro `q`.
   * @param tipo Valor del parámetro `tipo`.
   * @param ciudad Valor del parámetro `ciudad`.
   * @param departamento Valor del parámetro `departamento`.
   * @param activoParam Valor del parámetro `activoParam`.
   * @param conUbicacionParam Valor del parámetro `conUbicacionParam`.
   * @param especialidadIdParam Valor del parámetro `especialidadIdParam`.
   * @param latMinParam Valor del parámetro `latMinParam`.
   * @param latMaxParam Valor del parámetro `latMaxParam`.
   * @param lngMinParam Valor del parámetro `lngMinParam`.
   * @param lngMaxParam Valor del parámetro `lngMaxParam`.
   * @returns Colección de registros encontrados.
   */
  @Get()
  findAll(
    @Query("q") q?: string,
    @Query("tipo") tipo?: string,
    @Query("ciudad") ciudad?: string,
    @Query("departamento") departamento?: string,
    @Query("activo") activoParam?: string,
    @Query("conUbicacion") conUbicacionParam?: string,
    @Query("especialidadId") especialidadIdParam?: string,
    @Query("latMin") latMinParam?: string,
    @Query("latMax") latMaxParam?: string,
    @Query("lngMin") lngMinParam?: string,
    @Query("lngMax") lngMaxParam?: string,
  ) {
    return this.institucionService.findAll({
      q,
      tipo,
      ciudad,
      departamento,
      activo: this.parseOptionalBoolean(activoParam, "activo"),
      conUbicacion: this.parseOptionalBoolean(
        conUbicacionParam,
        "conUbicacion",
      ),
      especialidadId: this.parseOptionalNumber(
        especialidadIdParam,
        "especialidadId",
      ),
      latMin: this.parseOptionalNumber(latMinParam, "latMin"),
      latMax: this.parseOptionalNumber(latMaxParam, "latMax"),
      lngMin: this.parseOptionalNumber(lngMinParam, "lngMin"),
      lngMax: this.parseOptionalNumber(lngMaxParam, "lngMax"),
    });
  }

  /**
   * Find nearby.
   * @param latitudParam Valor del parámetro `latitudParam`.
   * @param longitudParam Valor del parámetro `longitudParam`.
   * @param radioKmParam Valor del parámetro `radioKmParam`.
   * @param limitParam Valor del parámetro `limitParam`.
   * @param tipo Valor del parámetro `tipo`.
   * @param ciudad Valor del parámetro `ciudad`.
   * @param departamento Valor del parámetro `departamento`.
   * @param activoParam Valor del parámetro `activoParam`.
   * @param especialidadIdParam Valor del parámetro `especialidadIdParam`.
   * @returns Resultado de la operación.
   */
  @Get("cercanas")
  findNearby(
    @Query("latitud") latitudParam: string,
    @Query("longitud") longitudParam: string,
    @Query("radioKm") radioKmParam?: string,
    @Query("limit") limitParam?: string,
    @Query("tipo") tipo?: string,
    @Query("ciudad") ciudad?: string,
    @Query("departamento") departamento?: string,
    @Query("activo") activoParam?: string,
    @Query("especialidadId") especialidadIdParam?: string,
  ) {
    return this.institucionService.findNearby({
      latitud: this.parseRequiredNumber(latitudParam, "latitud"),
      longitud: this.parseRequiredNumber(longitudParam, "longitud"),
      radioKm: this.parseOptionalNumber(radioKmParam, "radioKm"),
      limit: this.parseOptionalNumber(limitParam, "limit"),
      tipo,
      ciudad,
      departamento,
      activo: this.parseOptionalBoolean(activoParam, "activo"),
      especialidadId: this.parseOptionalNumber(
        especialidadIdParam,
        "especialidadId",
      ),
    });
  }

  /**
   * Find one.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.institucionService.findOne(id);
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
    @Body() payload: UpdateInstitucionsaludDto,
  ) {
    return this.institucionService.update(id, payload);
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.institucionService.remove(id);
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
   * Interpreta required number.
   * @param value Valor de entrada que se debe transformar o validar.
   * @param field Valor del parámetro `field`.
   * @returns Valor interpretado a partir de la entrada recibida.
   */
  private parseRequiredNumber(value: string | undefined, field: string) {
    if (value === undefined) {
      throw new BadRequestException(`${field} es obligatorio`);
    }
    return this.parseOptionalNumber(value, field)!;
  }
}
