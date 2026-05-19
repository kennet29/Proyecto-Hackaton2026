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
import { CreateSeguimientoposteventoDto } from "./dto/create-seguimientopostevento.dto";
import { UpdateSeguimientoposteventoDto } from "./dto/update-seguimientopostevento.dto";
import { SeguimientoposteventoService } from "./seguimientopostevento.service";

/**
 * Expone los endpoints HTTP del dominio seguimientopostevento.
 */
@Controller("seguimientopostevento")
export class SeguimientoposteventoController {
  constructor(
    private readonly seguimientoPosteventoService: SeguimientoposteventoService,
  ) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  @Post()
  create(@Body() payload: CreateSeguimientoposteventoDto) {
    return this.seguimientoPosteventoService.create(payload);
  }

  /**
   * Find all.
   * @param pacienteId Identificador asociado a paciente.
   * @param tipoEvento Valor del parámetro `tipoEvento`.
   * @param compartidos Valor del parámetro `compartidos`.
   * @returns Colección de registros encontrados.
   */
  @Get()
  findAll(
    @Query("pacienteId") pacienteId?: string,
    @Query("tipoEvento") tipoEvento?: string,
    @Query("compartidos") compartidos?: string,
  ) {
    return this.seguimientoPosteventoService.findAll(
      pacienteId ? Number(pacienteId) : undefined,
      tipoEvento,
      compartidos === undefined ? undefined : compartidos === "true",
    );
  }

  /**
   * Get historial.
   * @param pacienteId Identificador asociado a paciente.
   * @param tipoEvento Valor del parámetro `tipoEvento`.
   * @returns Resultado de la consulta solicitada.
   */
  @Get("paciente/:pacienteId/historial")
  getHistorial(
    @Param("pacienteId", ParseIntPipe) pacienteId: number,
    @Query("tipoEvento") tipoEvento?: string,
  ) {
    return this.seguimientoPosteventoService.getHistorial(
      pacienteId,
      tipoEvento,
    );
  }

  /**
   * Get compartidos.
   * @param pacienteId Identificador asociado a paciente.
   * @returns Resultado de la consulta solicitada.
   */
  @Get("paciente/:pacienteId/compartidos")
  getCompartidos(@Param("pacienteId", ParseIntPipe) pacienteId: number) {
    return this.seguimientoPosteventoService.getCompartidosConMedico(
      pacienteId,
    );
  }

  /**
   * Find one.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.seguimientoPosteventoService.findOne(id);
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
    @Body() payload: UpdateSeguimientoposteventoDto,
  ) {
    return this.seguimientoPosteventoService.update(id, payload);
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.seguimientoPosteventoService.remove(id);
  }
}
