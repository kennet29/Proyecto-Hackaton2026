import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
} from "@nestjs/common";
import { Request } from "express";
import { AuthenticatedUser } from "../../auth/auth.service";
import { CreateUsuarioPacienteDto } from "./dto/create-usuariopaciente.dto";
import { UpdateUsuarioPacienteDto } from "./dto/update-usuariopaciente.dto";
import { UsuarioPacienteService } from "./usuariopaciente.service";

/**
 * Expone los endpoints HTTP del dominio usuario paciente.
 */
@Controller("usuario-paciente")
export class UsuarioPacienteController {
  constructor(
    private readonly usuarioPacienteService: UsuarioPacienteService,
  ) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @param req Solicitud HTTP actual.
   * @returns Registro creado.
   */
  @Post()
  create(@Body() payload: CreateUsuarioPacienteDto, @Req() req: Request) {
    return this.usuarioPacienteService.link(
      req.user as AuthenticatedUser,
      payload,
    );
  }

  /**
   * Find mine.
   * @param req Solicitud HTTP actual.
   * @returns Resultado de la operación.
   */
  @Get("mis-pacientes")
  findMine(@Req() req: Request) {
    return this.usuarioPacienteService.listMine(req.user as AuthenticatedUser);
  }

  /**
   * Update.
   * @param id Identificador del registro objetivo.
   * @param payload Datos validados que recibe la operación.
   * @param req Solicitud HTTP actual.
   * @returns Registro actualizado.
   */
  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() payload: UpdateUsuarioPacienteDto,
    @Req() req: Request,
  ) {
    return this.usuarioPacienteService.update(
      id,
      payload,
      req.user as AuthenticatedUser,
    );
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @param req Solicitud HTTP actual.
   * @returns La operación se completa sin devolver contenido.
   */
  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number, @Req() req: Request) {
    return this.usuarioPacienteService.remove(
      id,
      req.user as AuthenticatedUser,
    );
  }
}
