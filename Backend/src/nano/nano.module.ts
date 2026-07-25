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

/**
 * Agrupa controladores y proveedores del dominio nano.
 */
@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([UsuarioNanoAppearance])],
  controllers: [NanoController],
  providers: [
    NanoService,
    NanoPromptBuilder,
    NanoAnalysisParser,
    NanoAppearanceService,
    OpenAiMealAnalysisGateway,
    {
      provide: MEAL_ANALYSIS_GATEWAY,
      useExisting: OpenAiMealAnalysisGateway,
    },
  ],
  exports: [NanoService, NanoAppearanceService],
})
export class NanoModule {}
