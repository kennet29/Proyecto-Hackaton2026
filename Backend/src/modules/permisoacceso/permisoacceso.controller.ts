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
} from '@nestjs/common';
import { Request } from 'express';
import { AuthenticatedUser } from '../../auth/auth.service';
import { CreatePermisoAccesoDto } from './dto/create-permisoacceso.dto';
import { PermisoaccesoService } from './permisoacceso.service';
import { UpdatePermisoAccesoDto } from './dto/update-permisoacceso.dto';
import { CreatePermisoAccesoQrDto } from './dto/create-permisoacceso-qr.dto';
import { ClaimPermisoAccesoQrDto } from './dto/claim-permisoacceso-qr.dto';

@Controller('permiso-acceso')
export class PermisoaccesoController {
  constructor(private readonly permisosService: PermisoaccesoService) {}

  @Post('paciente/:pacienteId')
  create(
    @Param('pacienteId', ParseIntPipe) pacienteId: number,
    @Body() payload: CreatePermisoAccesoDto,
    @Req() req: Request,
  ) {
    return this.permisosService.grant(pacienteId, payload, req.user as AuthenticatedUser);
  }

  @Get('paciente/:pacienteId')
  findForPaciente(
    @Param('pacienteId', ParseIntPipe) pacienteId: number,
    @Req() req: Request,
  ) {
    return this.permisosService.listForPaciente(pacienteId, req.user as AuthenticatedUser);
  }

  @Get('mios')
  findForMedico(@Req() req: Request) {
    return this.permisosService.listForMedico(req.user as AuthenticatedUser);
  }

  @Delete(':permisoId')
  revoke(@Param('permisoId', ParseIntPipe) permisoId: number, @Req() req: Request) {
    return this.permisosService.revoke(permisoId, req.user as AuthenticatedUser);
  }

  @Patch(':permisoId')
  update(
    @Param('permisoId', ParseIntPipe) permisoId: number,
    @Body() payload: UpdatePermisoAccesoDto,
    @Req() req: Request,
  ) {
    return this.permisosService.update(permisoId, payload, req.user as AuthenticatedUser);
  }

  @Post(':permisoId/qr')
  generateQr(
    @Param('permisoId', ParseIntPipe) permisoId: number,
    @Body() payload: CreatePermisoAccesoQrDto,
    @Req() req: Request,
  ) {
    return this.permisosService.createQrToken(permisoId, payload, req.user as AuthenticatedUser);
  }

  @Post('qr/claim')
  claimQr(@Body() payload: ClaimPermisoAccesoQrDto, @Req() req: Request) {
    return this.permisosService.claimQrToken(payload, req.user as AuthenticatedUser);
  }
}
