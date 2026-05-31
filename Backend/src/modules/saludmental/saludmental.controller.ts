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
  Req,
} from "@nestjs/common";
import { Request } from "express";
import { AuthenticatedUser } from "../../auth/auth.service";
import { PacienteAccessService } from "../../auth/paciente-access.service";
import { CreateSaludmentalDto } from "./dto/create-saludmental.dto";
import { UpdateSaludmentalHabitosDto } from "./dto/update-saludmental-habitos.dto";
import { UpdateSaludmentalRegistroDiarioDto } from "./dto/update-saludmental-registro-diario.dto";
import { UpdateSaludmentalDto } from "./dto/update-saludmental.dto";
import { SaludmentalService } from "./saludmental.service";

/**
 * Expone los endpoints HTTP del dominio saludmental.
 */
@Controller("salud-mental")
export class SaludmentalController {
  constructor(
    private readonly saludmentalService: SaludmentalService,
    private readonly pacienteAccessService: PacienteAccessService,
  ) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  @Post()
  create(@Body() payload: CreateSaludmentalDto) {
    return this.saludmentalService.create(payload);
  }

  /**
   * Find all.
   * @param pacienteIdParam Valor del parámetro `pacienteIdParam`.
   * @param req Solicitud HTTP actual.
   * @returns Colección de registros encontrados.
   */
  @Get()
  async findAll(
    @Query("pacienteId") pacienteIdParam: string | undefined,
    @Req() req: Request,
  ) {
    const user = req.user as AuthenticatedUser;
    const role = user?.role?.toLowerCase();
    if (!pacienteIdParam) {
      if (role === "admin" || role === "superadmin") {
        return this.saludmentalService.findAll();
      }
      throw new BadRequestException(
        "debes indicar un pacienteId para consultar salud mental",
      );
    }

    const pacienteId = Number(pacienteIdParam);
    if (Number.isNaN(pacienteId)) {
      throw new BadRequestException("pacienteId debe ser numerico");
    }
    await this.pacienteAccessService.assertAccess(user, pacienteId);
    const historial = await this.saludmentalService.getHistorial(pacienteId);
    return historial.historialPorFecha;
  }

  /**
   * Get historial.
   * @param pacienteId Identificador asociado a paciente.
   * @param req Solicitud HTTP actual.
   * @param desde Valor del parámetro `desde`.
   * @param hasta Valor del parámetro `hasta`.
   * @returns Resultado de la consulta solicitada.
   */
  @Get("paciente/:pacienteId/historial")
  async getHistorial(
    @Param("pacienteId", ParseIntPipe) pacienteId: number,
    @Req() req: Request,
    @Query("desde") desde?: string,
    @Query("hasta") hasta?: string,
  ) {
    await this.pacienteAccessService.assertAccess(
      req.user as AuthenticatedUser,
      pacienteId,
    );
    return this.saludmentalService.getHistorial(pacienteId, desde, hasta);
  }

  /**
   * Get estadisticas.
   * @param pacienteId Identificador asociado a paciente.
   * @param req Solicitud HTTP actual.
   * @param desde Valor del parámetro `desde`.
   * @param hasta Valor del parámetro `hasta`.
   * @returns Resultado de la consulta solicitada.
   */
  @Get("paciente/:pacienteId/estadisticas")
  async getEstadisticas(
    @Param("pacienteId", ParseIntPipe) pacienteId: number,
    @Req() req: Request,
    @Query("desde") desde?: string,
    @Query("hasta") hasta?: string,
  ) {
    await this.pacienteAccessService.assertAccess(
      req.user as AuthenticatedUser,
      pacienteId,
    );
    return this.saludmentalService.getEstadisticas(pacienteId, desde, hasta);
  }

  /**
   * Get alertas.
   * @param pacienteId Identificador asociado a paciente.
   * @param req Solicitud HTTP actual.
   * @returns Resultado de la consulta solicitada.
   */
  @Get("paciente/:pacienteId/alertas")
  async getAlertas(
    @Param("pacienteId", ParseIntPipe) pacienteId: number,
    @Req() req: Request,
  ) {
    await this.pacienteAccessService.assertAccess(
      req.user as AuthenticatedUser,
      pacienteId,
    );
    return this.saludmentalService.getAlertas(pacienteId);
  }

  /**
   * Get reporte medico.
   * @param pacienteId Identificador asociado a paciente.
   * @param req Solicitud HTTP actual.
   * @param desde Valor del parámetro `desde`.
   * @param hasta Valor del parámetro `hasta`.
   * @param formato Valor del parámetro `formato`.
   * @returns Resultado de la consulta solicitada.
   */
  @Get("paciente/:pacienteId/reporte-medico")
  async getReporteMedico(
    @Param("pacienteId", ParseIntPipe) pacienteId: number,
    @Req() req: Request,
    @Query("desde") desde?: string,
    @Query("hasta") hasta?: string,
    @Query("formato") formato?: string,
  ) {
    await this.pacienteAccessService.assertAccess(
      req.user as AuthenticatedUser,
      pacienteId,
    );
    return this.saludmentalService.getReporteMedico(
      pacienteId,
      desde,
      hasta,
      formato,
    );
  }

  /**
   * Find one.
   * @param id Identificador del registro objetivo.
   * @param req Solicitud HTTP actual.
   * @returns Resultado de la consulta solicitada.
   */
  @Get(":id")
  async findOne(@Param("id", ParseIntPipe) id: number, @Req() req: Request) {
    const record = await this.saludmentalService.findOne(id);
    await this.pacienteAccessService.assertAccess(
      req.user as AuthenticatedUser,
      record.pacienteId,
    );
    return record;
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
    @Body() payload: UpdateSaludmentalDto,
  ) {
    return this.saludmentalService.update(id, payload);
  }

  /**
   * Update registro diario.
   * @param id Identificador del registro objetivo.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro actualizado.
   */
  @Patch(":id/registro-diario")
  updateRegistroDiario(
    @Param("id", ParseIntPipe) id: number,
    @Body() payload: UpdateSaludmentalRegistroDiarioDto,
  ) {
    return this.saludmentalService.updateRegistroDiario(id, payload);
  }

  /**
   * Update habitos.
   * @param id Identificador del registro objetivo.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro actualizado.
   */
  @Patch(":id/habitos")
  updateHabitos(
    @Param("id", ParseIntPipe) id: number,
    @Body() payload: UpdateSaludmentalHabitosDto,
  ) {
    return this.saludmentalService.updateHabitos(id, payload);
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.saludmentalService.remove(id);
  }
}
