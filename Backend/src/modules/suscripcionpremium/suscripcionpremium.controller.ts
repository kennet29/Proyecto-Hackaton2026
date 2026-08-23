/**
 * @file Backend/src/modules/suscripcionpremium/suscripcionpremium.controller.ts
 * @description TypeScript module implementation.
 */

import { Body, Controller, Get, Param, ParseIntPipe, Post, Req } from "@nestjs/common";
import { Request } from "express";
import { Roles } from "../../auth/decorators/roles.decorator";
import { AuthenticatedUser } from "../../auth/auth.service";
import { AsignarSuscripcionPremiumDto } from "./dto/asignar-suscripcion-premium.dto";
import { SuscripcionPremiumService } from "./suscripcionpremium.service";

@Controller("suscripciones-premium")
export class SuscripcionPremiumController {
  constructor(private readonly service: SuscripcionPremiumService) {}

  @Post()
  @Roles("admin", "superadmin")
  asignar(@Body() payload: AsignarSuscripcionPremiumDto, @Req() req: Request) {
    const actor = req.user as AuthenticatedUser;
    return this.service.asignar(payload, actor.username ?? `usuario-${actor.userId}`);
  }

  @Get()
  @Roles("admin", "superadmin")
  listar() {
    return this.service.listar();
  }

  @Get("mi-suscripcion")
  miSuscripcion(@Req() req: Request) {
    return this.service.obtenerActual((req.user as AuthenticatedUser).userId);
  }

  @Get("usuario/:usuarioId")
  @Roles("admin", "superadmin")
  porUsuario(@Param("usuarioId", ParseIntPipe) usuarioId: number) {
    return this.service.obtenerActual(usuarioId);
  }
}
