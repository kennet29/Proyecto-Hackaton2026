import { Body, Controller, Get, Param, Patch, Req } from "@nestjs/common";
import { Request } from "express";
import { Roles } from "../../auth/decorators/roles.decorator";
import { AuthenticatedUser } from "../../auth/auth.service";
import { ActualizarConfiguracionPagoDto } from "./dto/actualizar-configuracion-pago.dto";
import { ConfiguracionPagoService } from "./configuracionpago.service";

@Controller("configuracion-pagos")
export class ConfiguracionPagoController {
  constructor(private readonly service: ConfiguracionPagoService) {}
  @Get() listar() { return this.service.listar(); }
  @Get("admin") @Roles("admin", "superadmin") listarAdmin() { return this.service.listarAdmin(); }
  @Patch(":banco") @Roles("admin", "superadmin")
  actualizar(@Param("banco") banco: string, @Body() payload: ActualizarConfiguracionPagoDto, @Req() req: Request) {
    const user = req.user as AuthenticatedUser;
    return this.service.actualizar(banco, payload, user.username);
  }
}
