import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MEAL_ANALYSIS_GATEWAY } from "./meal-analysis.gateway";
import { NanoAnalysisParser } from "./nano-analysis.parser";
import { NanoController } from "./nano.controller";
import { OpenAiMealAnalysisGateway } from "./openai-meal-analysis.gateway";
import { NanoPromptBuilder } from "./nano-prompt.builder";
import { NanoService } from "./nano.service";
import { NanoAppearanceService } from "./nano-appearance.service";
import { UsuarioNanoAppearance } from "./entities/usuario-nano-appearance.entity";
import { Lesion } from "../modules/lesion/lesion.entity";
import { Embarazo } from "../modules/embarazo/embarazo.entity";
import { Condicioncronica } from "../modules/condicioncronica/condicioncronica.entity";
import { Tipocondicioncronica } from "../modules/tipocondicioncronica/tipocondicioncronica.entity";
import { Seguimientopostevento } from "../modules/seguimientopostevento/seguimientopostevento.entity";
import { NanoTrainingSafetyService } from "./nano-training-safety.service";

/**
 * Agrupa controladores y proveedores del dominio nano.
 */
@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([UsuarioNanoAppearance, Lesion, Embarazo, Condicioncronica, Tipocondicioncronica, Seguimientopostevento])],
  controllers: [NanoController],
  providers: [
    NanoService,
    NanoPromptBuilder,
    NanoAnalysisParser,
    NanoAppearanceService,
    NanoTrainingSafetyService,
    OpenAiMealAnalysisGateway,
    {
      provide: MEAL_ANALYSIS_GATEWAY,
      useExisting: OpenAiMealAnalysisGateway,
    },
  ],
  exports: [NanoService, NanoAppearanceService],
})
export class NanoModule {}
