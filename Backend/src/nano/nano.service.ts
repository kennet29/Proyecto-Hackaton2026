import {
  BadGatewayException,
  BadRequestException,
  Inject,
  Injectable,
} from "@nestjs/common";
import { decodeBase64Image, validateImageMimeType } from "../common/utils/base64-image.util";
import { AnalyzeMealDto } from "./dto/analyze-meal.dto";
import {
  MEAL_ANALYSIS_GATEWAY,
  MealAnalysisGateway,
} from "./meal-analysis.gateway";
import { NanoAnalysisParser } from "./nano-analysis.parser";
import { optimizeNanoImage } from "./nano-image.optimizer";
import { NanoPromptBuilder } from "./nano-prompt.builder";

/**
 * Orquesta el caso de uso de analisis de comidas.
 *
 * El transporte hacia el proveedor, la construccion del prompt y la
 * interpretacion de la respuesta viven en colaboradores independientes.
 */
@Injectable()
export class NanoService {
  constructor(
    @Inject(MEAL_ANALYSIS_GATEWAY)
    private readonly analysisGateway: MealAnalysisGateway,
    private readonly promptBuilder: NanoPromptBuilder,
    private readonly analysisParser: NanoAnalysisParser,
  ) {}

  async analyzeMeal(payload: AnalyzeMealDto) {
    const imageBuffer = decodeBase64Image(
      payload.imageBase64,
      "imageBase64",
    );
    if (!imageBuffer) {
      throw new BadRequestException("imageBase64 no contiene datos validos");
    }

    validateImageMimeType(payload.imageMimeType, "imageMimeType");
    const optimizedImage = await optimizeNanoImage(imageBuffer);
    const prompt = this.promptBuilder.build(
      payload.goalKey,
      payload.goalLabel,
      payload.userNote,
    );
    const providerResponse = await this.analysisGateway.analyze({
      prompt,
      image: {
        buffer: optimizedImage.buffer,
        mimeType: optimizedImage.mimeType,
      },
    });

    if (!providerResponse.text) {
      throw new BadGatewayException(
        "OpenAI no devolvio una recomendacion util para esta imagen.",
      );
    }

    const analysis = this.analysisParser.parse(providerResponse.text);
    if (!analysis.is_food) {
      throw new BadRequestException(analysis.rejection_reason);
    }

    return this.analysisParser.toMealResult(analysis, {
      goalKey: payload.goalKey,
      goalLabel: payload.goalLabel,
      model: providerResponse.model,
    });
  }
}
