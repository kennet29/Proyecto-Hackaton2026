import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MEAL_ANALYSIS_GATEWAY } from "./meal-analysis.gateway";
import { NanoAnalysisParser } from "./nano-analysis.parser";
import { NanoController } from "./nano.controller";
import { OpenAiMealAnalysisGateway } from "./openai-meal-analysis.gateway";
import { NanoPromptBuilder } from "./nano-prompt.builder";
import { NanoService } from "./nano.service";

/**
 * Agrupa controladores y proveedores del dominio nano.
 */
@Module({
  imports: [ConfigModule],
  controllers: [NanoController],
  providers: [
    NanoService,
    NanoPromptBuilder,
    NanoAnalysisParser,
    OpenAiMealAnalysisGateway,
    {
      provide: MEAL_ANALYSIS_GATEWAY,
      useExisting: OpenAiMealAnalysisGateway,
    },
  ],
  exports: [NanoService],
})
export class NanoModule {}
