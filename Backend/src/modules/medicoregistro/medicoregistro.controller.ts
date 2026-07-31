import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
} from "@nestjs/common";
import { Request } from "express";
import { CreateMedicoregistroDto } from "./dto/create-medicoregistro.dto";
import { UpdateMedicoregistroDto } from "./dto/update-medicoregistro.dto";
import { MedicoregistroService } from "./medicoregistro.service";
import { Roles } from "../../auth/decorators/roles.decorator";
import { AuthenticatedUser } from "../../auth/auth.service";

/**
 * Expone los endpoints HTTP del dominio medicoregistro.
 */
@Controller("medicoregistro")
export class MedicoregistroController {
  constructor(private readonly medicoregistroService: MedicoregistroService) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  @Post()
  create(@Body() payload: CreateMedicoregistroDto, @Req() req: Request) {
    this.assertSelfOrAdmin(req.user as AuthenticatedUser, payload.usuarioId);
    return this.medicoregistroService.create(payload);
  }

  /**
   * Find all.
   * @returns Colección de registros encontrados.
   */
  @Get()
  @Roles("admin", "superadmin")
  findAll() {
    return this.medicoregistroService.findAll();
  }

  @Get("catalogo/aprobados")
  findApprovedCatalog() {
    return this.medicoregistroService.findApprovedCatalog();
  }

  /**
   * Find by usuario.
   * @param usuarioId Identificador asociado a usuario.
   * @returns Resultado de la operación.
   */
  @Get("usuario/:usuarioId")
  findByUsuario(
    @Param("usuarioId", ParseIntPipe) usuarioId: number,
    @Req() req: Request,
  ) {
    this.assertSelfOrAdmin(req.user as AuthenticatedUser, usuarioId);
    return this.medicoregistroService.findByUsuario(usuarioId);
  }

  /**
   * Find one.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  @Get(":id")
  @Roles("admin", "superadmin")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.medicoregistroService.findOne(id);
  }

  /**
   * Update.
   * @param id Identificador del registro objetivo.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro actualizado.
   */
  @Patch(":id")
  @Roles("admin", "superadmin")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() payload: UpdateMedicoregistroDto,
  ) {
    return this.medicoregistroService.update(id, payload);
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  @Delete(":id")
  @Roles("admin", "superadmin")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.medicoregistroService.remove(id);
  }

  private assertSelfOrAdmin(user: AuthenticatedUser, usuarioId: number): void {
    const role = user.role?.trim().toLowerCase();
    if (
      user.userId !== usuarioId &&
      role !== "admin" &&
      role !== "superadmin"
    ) {
      throw new ForbiddenException("no puedes consultar datos de otro usuario");
    }
  }
}
