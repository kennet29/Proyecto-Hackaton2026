import {
  BadGatewayException,
  BadRequestException,
  Inject,
  Injectable,
} from "@nestjs/common";
import { z } from "zod";
import { decodeBase64Image, validateImageMimeType } from "../common/utils/base64-image.util";
import { AnalyzeMealDto } from "./dto/analyze-meal.dto";
import {
  MEAL_ANALYSIS_GATEWAY,
  MealAnalysisGateway,
} from "./meal-analysis.gateway";
import { NanoAnalysisParser } from "./nano-analysis.parser";
import { optimizeNanoImage } from "./nano-image.optimizer";
import { NanoPromptBuilder } from "./nano-prompt.builder";
import { CreateRecipeDto } from "./dto/create-recipe.dto";
import { CreateTrainingPlanDto } from "./dto/create-training-plan.dto";

const recipeSchema = z.object({
  title: z.string().trim().min(3).max(120),
  servings: z.string().trim().min(1).max(80),
  time: z.string().trim().min(1).max(80),
  ingredients: z.array(z.string().trim().min(1).max(180)).min(2).max(15),
  steps: z.array(z.string().trim().min(1).max(500)).min(2).max(10),
  nanoTip: z.string().trim().min(10).max(500),
});

const trainingPlanSchema = z.object({
  title: z.string().trim().min(3).max(120),
  summary: z.string().trim().min(10).max(500),
  weeklyDays: z.array(z.object({
    day: z.string().trim().min(2).max(30),
    focus: z.string().trim().min(3).max(180),
    duration: z.string().trim().min(1).max(60),
    exercises: z.array(z.object({
      name: z.string().trim().min(2).max(100),
      sets: z.string().trim().min(1).max(40),
      reps: z.string().trim().min(1).max(60),
      rest: z.string().trim().min(1).max(60),
      notes: z.string().trim().max(220).optional().default(""),
    })).max(12),
  })).length(7),
  nanoTip: z.string().trim().min(10).max(500),
});

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

  async createRecipe(payload: CreateRecipeDto) {
    const prompt = this.promptBuilder.buildRecipe(
      payload.goalKey,
      payload.goalLabel,
      payload.ingredients,
      payload.preferences,
      payload.allowNanoRecommendations,
    );
    const providerResponse = await this.analysisGateway.generateText(prompt);
    if (!providerResponse.text) {
      throw new BadGatewayException("Nano Chef no devolvio una receta util.");
    }

    let recipe: z.infer<typeof recipeSchema>;
    try {
      const cleaned = providerResponse.text
        .trim()
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "");
      recipe = recipeSchema.parse(JSON.parse(cleaned));
    } catch {
      throw new BadGatewayException(
        "Nano Chef devolvio una receta con formato invalido.",
      );
    }

    return {
      recipe,
      goalLabel: payload.goalLabel,
      model: providerResponse.model,
    };
  }

  async createTrainingPlan(payload: CreateTrainingPlanDto) {
    const prompt = this.promptBuilder.buildTrainingPlan(
      payload.goalLabel,
      payload.level,
      payload.equipment,
      payload.limitations,
    );
    const providerResponse = await this.analysisGateway.generateText(prompt);
    if (!providerResponse.text) {
      throw new BadGatewayException("Nano Entrenador no devolvio una rutina util.");
    }

    try {
      const cleaned = providerResponse.text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
      return {
        plan: trainingPlanSchema.parse(JSON.parse(cleaned)),
        goalLabel: payload.goalLabel,
        model: providerResponse.model,
      };
    } catch {
      throw new BadGatewayException("Nano Entrenador devolvio una rutina con formato invalido.");
    }
  }
}
