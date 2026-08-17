import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Req } from "@nestjs/common";
import { Request } from "express";
import { Roles } from "../../auth/decorators/roles.decorator";
import { AuthenticatedUser } from "../../auth/auth.service";
import { CrearPagoPremiumDto, RevisarPagoPremiumDto } from "./dto/pago-premium.dto";
import { PagoPremiumService } from "./pagopremium.service";

@Controller("pagos-premium")
export class PagoPremiumController {
  constructor(private readonly service: PagoPremiumService) {}
  @Post() crear(@Body() payload: CrearPagoPremiumDto, @Req() req: Request) { return this.service.crear((req.user as AuthenticatedUser).userId, payload); }
  @Get("mis-pagos") misPagos(@Req() req: Request) { return this.service.misPagos((req.user as AuthenticatedUser).userId); }
  @Get() @Roles("admin", "superadmin") listar() { return this.service.listar(); }
  @Patch(":id/revision") @Roles("admin", "superadmin") revisar(@Param("id", ParseIntPipe) id: number, @Body() payload: RevisarPagoPremiumDto, @Req() req: Request) { return this.service.revisar(id, payload, (req.user as AuthenticatedUser).username); }
}
