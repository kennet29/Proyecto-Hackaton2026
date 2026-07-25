import { Body, Controller, Get, Patch, Post, Req } from "@nestjs/common";
import { Request } from "express";
import type { AuthenticatedUser } from "../auth/auth.service";
import { NanoService } from "./nano.service";
import { AnalyzeMealDto } from "./dto/analyze-meal.dto";
import { SelectNanoAppearanceDto } from "./dto/select-nano-appearance.dto";
import { NanoAppearanceService } from "./nano-appearance.service";

/**
 * Expone los endpoints HTTP del dominio nano.
 */
@Controller("nano")
export class NanoController {
  constructor(
    private readonly nanoService: NanoService,
    private readonly nanoAppearanceService: NanoAppearanceService,
  ) {}

  @Get("appearance")
  getAppearance(@Req() req: Request) {
    const user = req.user as AuthenticatedUser;
    return this.nanoAppearanceService.getState(user.userId);
  }

  @Patch("appearance")
  selectAppearance(
    @Body() payload: SelectNanoAppearanceDto,
    @Req() req: Request,
  ) {
    const user = req.user as AuthenticatedUser;
    return this.nanoAppearanceService.select(user.userId, payload.appearanceId);
  }

  /**
   * Analyze meal.
   * @param payload Datos validados que recibe la operacion.
   * @returns Resultado de la operacion.
   */
  @Post("analyze-meal")
  analyzeMeal(@Body() payload: AnalyzeMealDto) {
    return this.nanoService.analyzeMeal(payload);
  }
}
