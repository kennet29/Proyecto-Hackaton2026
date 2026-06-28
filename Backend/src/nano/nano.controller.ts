import { Body, Controller, Post } from "@nestjs/common";
import { NanoService } from "./nano.service";
import { AnalyzeMealDto } from "./dto/analyze-meal.dto";

/**
 * Expone los endpoints HTTP del dominio nano.
 */
@Controller("nano")
export class NanoController {
  constructor(private readonly nanoService: NanoService) {}

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
