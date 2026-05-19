import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { Request } from "express";
import { ConsultamedicaService } from "./consultamedica.service";
import { CreateConsultamedicaDto } from "./dto/create-consultamedica.dto";
import { UpdateConsultamedicaDto } from "./dto/update-consultamedica.dto";
import { PacienteAccessService } from "../../auth/paciente-access.service";
import { AuthenticatedUser } from "../../auth/auth.service";

/**
 * Expone los endpoints HTTP del dominio consultamedica.
 */
@Controller("consultamedica")
export class ConsultamedicaController {
  constructor(
    private readonly consultamedicaservice: ConsultamedicaService,
    private readonly pacienteAccessService: PacienteAccessService,
  ) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  @Post()
  create(@Body() payload: CreateConsultamedicaDto) {
    return this.consultamedicaservice.create(payload);
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
    if (user?.role?.toLowerCase() === "medico" && !pacienteIdParam) {
      throw new BadRequestException(
        "los medicos deben indicar un pacienteId para consultar",
      );
    }
    if (pacienteIdParam) {
      const pacienteId = Number(pacienteIdParam);
      if (Number.isNaN(pacienteId)) {
        throw new BadRequestException("pacienteId debe ser numerico");
      }
      await this.pacienteAccessService.assertAccess(user, pacienteId);
      return this.consultamedicaservice.findAllByPaciente(pacienteId);
    }
    return this.consultamedicaservice.findAll();
  }

  /**
   * Find one.
   * @param id Identificador del registro objetivo.
   * @param req Solicitud HTTP actual.
   * @returns Resultado de la consulta solicitada.
   */
  @Get(":id")
  async findOne(@Param("id") id: string, @Req() req: Request) {
    const entity = await this.consultamedicaservice.findOne(id);
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
   * @returns Registro actualizado.
   */
  @Patch(":id")
  update(@Param("id") id: string, @Body() payload: UpdateConsultamedicaDto) {
    return this.consultamedicaservice.update(id, payload);
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.consultamedicaservice.remove(id);
  }
}
