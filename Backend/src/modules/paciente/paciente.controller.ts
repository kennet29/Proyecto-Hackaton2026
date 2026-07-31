import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from "@nestjs/common";
import { Request } from "express";
import { AuthenticatedUser } from "../../auth/auth.service";
import { Roles } from "../../auth/decorators/roles.decorator";
import { PacienteAccessService } from "../../auth/paciente-access.service";
import { PacienteService } from "./paciente.service";
import { CreatePacienteDto } from "./dto/create-paciente.dto";
import { UpdatePacienteDto } from "./dto/update-paciente.dto";

/**
 * Expone los endpoints HTTP del dominio paciente.
 */
@Controller("paciente")
export class PacienteController {
  constructor(
    private readonly pacienteservice: PacienteService,
    private readonly pacienteAccessService: PacienteAccessService,
  ) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  @Post()
  create(@Body() payload: CreatePacienteDto, @Req() req: Request) {
    const actor = req.user as AuthenticatedUser;
    return this.pacienteservice.create({
      ...payload,
      creadopor: actor.username,
    });
  }

  /**
   * Find all.
   * @returns Colección de registros encontrados.
   */
  @Roles("admin", "superadmin")
  @Get()
  findAll() {
    return this.pacienteservice.findAll();
  }

  /**
   * Get clinical summary.
   * @param id Identificador del registro objetivo.
   * @param req Solicitud HTTP actual.
   * @returns Resultado de la consulta solicitada.
   */
  @Get(":id/resumen-clinico")
  async getClinicalSummary(@Param("id") id: string, @Req() req: Request) {
    const pacienteId = Number(id);
    await this.pacienteAccessService.assertAccess(
      req.user as AuthenticatedUser,
      pacienteId,
    );
    return this.pacienteservice.getClinicalSummary(pacienteId);
  }

  /**
   * Find one.
   * @param id Identificador del registro objetivo.
   * @param req Solicitud HTTP actual.
   * @returns Resultado de la consulta solicitada.
   */
  @Get(":id")
  async findOne(@Param("id") id: string, @Req() req: Request) {
    const entity = await this.pacienteservice.findOne(id);
    await this.pacienteAccessService.assertAccess(
      req.user as AuthenticatedUser,
      entity.pacienteId,
    );
    return entity;
  }

  /**
   * Update.
   * @param id Identificador del registro objetivo.
   * @param payload Datos validados que recibe la operación.
   * @param req Solicitud HTTP actual.
   * @returns Registro actualizado.
   */
  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() payload: UpdatePacienteDto,
    @Req() req: Request,
  ) {
    const entity = await this.pacienteservice.findOne(id);
    await this.pacienteAccessService.assertAccess(
      req.user as AuthenticatedUser,
      entity.pacienteId,
    );
    return this.pacienteservice.update(id, payload);
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @param req Solicitud HTTP actual.
   * @returns La operación se completa sin devolver contenido.
   */
  @Delete(":id")
  async remove(@Param("id") id: string, @Req() req: Request) {
    const entity = await this.pacienteservice.findOne(id);
    await this.pacienteAccessService.assertAccess(
      req.user as AuthenticatedUser,
      entity.pacienteId,
    );
    return this.pacienteservice.remove(id);
  }
}
