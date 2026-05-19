import {
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
import { CreateSeguimientofisicoDto } from "./dto/create-seguimientofisico.dto";
import { UpdateSeguimientofisicoDto } from "./dto/update-seguimientofisico.dto";
import { SeguimientofisicoService } from "./seguimientofisico.service";

/**
 * Expone los endpoints HTTP del dominio seguimientofisico.
 */
@Controller("seguimientofisico")
export class SeguimientofisicoController {
  constructor(
    private readonly seguimientoFisicoService: SeguimientofisicoService,
  ) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  @Post()
  create(@Body() payload: CreateSeguimientofisicoDto) {
    return this.seguimientoFisicoService.create(payload);
  }

  /**
   * Find all.
   * @param pacienteId Identificador asociado a paciente.
   * @param desde Valor del parámetro `desde`.
   * @param hasta Valor del parámetro `hasta`.
   * @returns Colección de registros encontrados.
   */
  @Get()
  findAll(
    @Query("pacienteId") pacienteId?: string,
    @Query("desde") desde?: string,
    @Query("hasta") hasta?: string,
  ) {
    return this.seguimientoFisicoService.findAll(
      pacienteId ? Number(pacienteId) : undefined,
      desde,
      hasta,
    );
  }

  /**
   * Get historial.
   * @param pacienteId Identificador asociado a paciente.
   * @param desde Valor del parámetro `desde`.
   * @param hasta Valor del parámetro `hasta`.
   * @returns Resultado de la consulta solicitada.
   */
  @Get("paciente/:pacienteId/historial")
  getHistorial(
    @Param("pacienteId", ParseIntPipe) pacienteId: number,
    @Query("desde") desde?: string,
    @Query("hasta") hasta?: string,
  ) {
    return this.seguimientoFisicoService.getHistorial(pacienteId, desde, hasta);
  }

  /**
   * Get resumen.
   * @param pacienteId Identificador asociado a paciente.
   * @param desde Valor del parámetro `desde`.
   * @param hasta Valor del parámetro `hasta`.
   * @returns Resultado de la consulta solicitada.
   */
  @Get("paciente/:pacienteId/resumen")
  getResumen(
    @Param("pacienteId", ParseIntPipe) pacienteId: number,
    @Query("desde") desde?: string,
    @Query("hasta") hasta?: string,
  ) {
    return this.seguimientoFisicoService.getResumen(pacienteId, desde, hasta);
  }

  /**
   * Get peso progress.
   * @param pacienteId Identificador asociado a paciente.
   * @param desde Valor del parámetro `desde`.
   * @param hasta Valor del parámetro `hasta`.
   * @returns Resultado de la consulta solicitada.
   */
  @Get("paciente/:pacienteId/progreso-peso")
  getPesoProgress(
    @Param("pacienteId", ParseIntPipe) pacienteId: number,
    @Query("desde") desde?: string,
    @Query("hasta") hasta?: string,
  ) {
    return this.seguimientoFisicoService.getPesoProgress(
      pacienteId,
      desde,
      hasta,
    );
  }

  /**
   * Get logros.
   * @param pacienteId Identificador asociado a paciente.
   * @returns Resultado de la consulta solicitada.
   */
  @Get("paciente/:pacienteId/logros")
  getLogros(@Param("pacienteId", ParseIntPipe) pacienteId: number) {
    return this.seguimientoFisicoService.getLogros(pacienteId);
  }

  /**
   * Find one.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.seguimientoFisicoService.findOne(id);
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
    @Body() payload: UpdateSeguimientofisicoDto,
  ) {
    return this.seguimientoFisicoService.update(id, payload);
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.seguimientoFisicoService.remove(id);
  }
}
