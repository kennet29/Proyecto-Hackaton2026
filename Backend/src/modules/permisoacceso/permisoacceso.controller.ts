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
import { Public } from "../../auth/decorators/public.decorator";
import { AuthenticatedUser } from "../../auth/auth.service";
import { CreatePermisoAccesoDto } from "./dto/create-permisoacceso.dto";
import { PermisoaccesoService } from "./permisoacceso.service";
import { UpdatePermisoAccesoDto } from "./dto/update-permisoacceso.dto";
import { CreatePermisoAccesoQrDto } from "./dto/create-permisoacceso-qr.dto";
import { ClaimPermisoAccesoQrDto } from "./dto/claim-permisoacceso-qr.dto";
import { CreatePermisoAccesoLinkDto } from "./dto/create-permisoacceso-link.dto";
import { CreatePermisoAccesoCodeDto } from "./dto/create-permisoacceso-code.dto";
import { ClaimPermisoAccesoCodeDto } from "./dto/claim-permisoacceso-code.dto";

/**
 * Expone los endpoints HTTP del dominio permisoacceso.
 */
@Controller("permiso-acceso")
export class PermisoaccesoController {
  constructor(private readonly permisosService: PermisoaccesoService) {}

  /**
   * Create.
   * @param pacienteId Identificador asociado a paciente.
   * @param payload Datos validados que recibe la operación.
   * @param req Solicitud HTTP actual.
   * @returns Registro creado.
   */
  @Post("paciente/:pacienteId")
  create(
    @Param("pacienteId", ParseIntPipe) pacienteId: number,
    @Body() payload: CreatePermisoAccesoDto,
    @Req() req: Request,
  ) {
    return this.permisosService.grant(
      pacienteId,
      payload,
      req.user as AuthenticatedUser,
    );
  }

  @Post("paciente/:pacienteId/codigo")
  createAccessCode(
    @Param("pacienteId", ParseIntPipe) pacienteId: number,
    @Body() payload: CreatePermisoAccesoCodeDto,
    @Req() req: Request,
  ) {
    return this.permisosService.createAccessCode(
      pacienteId,
      payload,
      req.user as AuthenticatedUser,
    );
  }

  /**
   * Find for paciente.
   * @param pacienteId Identificador asociado a paciente.
   * @param req Solicitud HTTP actual.
   * @returns Resultado de la operación.
   */
  @Get("paciente/:pacienteId")
  findForPaciente(
    @Param("pacienteId", ParseIntPipe) pacienteId: number,
    @Req() req: Request,
  ) {
    return this.permisosService.listForPaciente(
      pacienteId,
      req.user as AuthenticatedUser,
    );
  }

  /**
   * Find for medico.
   * @param req Solicitud HTTP actual.
   * @returns Resultado de la operación.
   */
  @Get("mios")
  findForMedico(@Req() req: Request) {
    return this.permisosService.listForMedico(req.user as AuthenticatedUser);
  }

  @Get("medico/historial/:pacienteId")
  getFullHistoryForDoctor(
    @Param("pacienteId", ParseIntPipe) pacienteId: number,
    @Req() req: Request,
  ) {
    return this.permisosService.getFullHistoryForDoctor(
      pacienteId,
      req.user as AuthenticatedUser,
    );
  }

  /**
   * Revoke.
   * @param permisoId Identificador asociado a permiso.
   * @param req Solicitud HTTP actual.
   * @returns Resultado de la operación.
   */
  @Delete(":permisoId")
  revoke(
    @Param("permisoId", ParseIntPipe) permisoId: number,
    @Req() req: Request,
  ) {
    return this.permisosService.revoke(
      permisoId,
      req.user as AuthenticatedUser,
    );
  }

  /**
   * Update.
   * @param permisoId Identificador asociado a permiso.
   * @param payload Datos validados que recibe la operación.
   * @param req Solicitud HTTP actual.
   * @returns Registro actualizado.
   */
  @Patch(":permisoId")
  update(
    @Param("permisoId", ParseIntPipe) permisoId: number,
    @Body() payload: UpdatePermisoAccesoDto,
    @Req() req: Request,
  ) {
    return this.permisosService.update(
      permisoId,
      payload,
      req.user as AuthenticatedUser,
    );
  }

  /**
   * Generate qr.
   * @param permisoId Identificador asociado a permiso.
   * @param payload Datos validados que recibe la operación.
   * @param req Solicitud HTTP actual.
   * @returns Resultado de la operación.
   */
  @Post(":permisoId/qr")
  generateQr(
    @Param("permisoId", ParseIntPipe) permisoId: number,
    @Body() payload: CreatePermisoAccesoQrDto,
    @Req() req: Request,
  ) {
    return this.permisosService.createQrToken(
      permisoId,
      payload,
      req.user as AuthenticatedUser,
    );
  }

  /**
   * Generate share link.
   * @param permisoId Identificador asociado a permiso.
   * @param payload Datos validados que recibe la operaciÃ³n.
   * @param req Solicitud HTTP actual.
   * @returns Resultado de la operaciÃ³n.
   */
  @Post(":permisoId/enlace")
  generateShareLink(
    @Param("permisoId", ParseIntPipe) permisoId: number,
    @Body() payload: CreatePermisoAccesoLinkDto,
    @Req() req: Request,
  ) {
    return this.permisosService.createShareLink(
      permisoId,
      payload,
      req.user as AuthenticatedUser,
    );
  }

  /**
   * Resolve share link.
   * @param token Token firmado incluido en el enlace.
   * @returns JSON con los datos compartidos.
   */
  @Public()
  @Get("compartido/:token")
  resolveShareLink(@Param("token") token: string) {
    return this.permisosService.resolveShareLink(token);
  }

  /**
   * Claim qr.
   * @param payload Datos validados que recibe la operación.
   * @param req Solicitud HTTP actual.
   * @returns Resultado de la operación.
   */
  @Post("qr/claim")
  claimQr(@Body() payload: ClaimPermisoAccesoQrDto, @Req() req: Request) {
    return this.permisosService.claimQrToken(
      payload,
      req.user as AuthenticatedUser,
    );
  }

  @Post("codigo/claim")
  claimAccessCode(
    @Body() payload: ClaimPermisoAccesoCodeDto,
    @Req() req: Request,
  ) {
    return this.permisosService.claimAccessCode(
      payload,
      req.user as AuthenticatedUser,
    );
  }
}
