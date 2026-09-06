import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Query, Req } from "@nestjs/common";
import { Request } from "express";
import { AuthenticatedUser } from "../../auth/auth.service";
import { ActualizarLimiteDto, GuardarGastoDto } from "./dto/presupuesto-medico.dto";
import { PresupuestoMedicoService } from "./presupuestomedico.service";

@Controller("presupuestos-medicos")
export class PresupuestoMedicoController {
  constructor(private readonly service: PresupuestoMedicoService) {}

  @Get()
  obtener(@Query("mes") month: string, @Req() req: Request) {
    return this.service.obtener((req.user as AuthenticatedUser).userId, month);
  }

  @Put(":mes")
  actualizarLimite(@Param("mes") month: string, @Body() payload: ActualizarLimiteDto, @Req() req: Request) {
    return this.service.actualizarLimite((req.user as AuthenticatedUser).userId, month, payload);
  }

  @Post(":mes/gastos")
  crearGasto(@Param("mes") month: string, @Body() payload: GuardarGastoDto, @Req() req: Request) {
    return this.service.crearGasto((req.user as AuthenticatedUser).userId, month, payload);
  }

  @Patch("gastos/:id")
  editarGasto(@Param("id", ParseIntPipe) id: number, @Body() payload: GuardarGastoDto, @Req() req: Request) {
    return this.service.editarGasto((req.user as AuthenticatedUser).userId, id, payload);
  }

  @Delete("gastos/:id")
  eliminarGasto(@Param("id", ParseIntPipe) id: number, @Req() req: Request) {
    return this.service.eliminarGasto((req.user as AuthenticatedUser).userId, id);
  }
}
