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
import { NanoTrainingSafetyService } from "./nano-training-safety.service";

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
    private readonly trainingSafety: NanoTrainingSafetyService,
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
      recipe = this.parseRecipe(providerResponse.text);
    } catch {
      throw new BadGatewayException(
        "Nano Chef devolvio una receta con formato invalido.",
      );
    }

    const requiredIngredients = this.parseRequiredIngredients(payload.ingredients);
    if (requiredIngredients.length && !this.usesAllRequiredIngredients(recipe, requiredIngredients)) {
      const correctionPrompt = [
        prompt,
        "CORRECCION OBLIGATORIA: La receta anterior no uso todos los ingredientes disponibles como ingredientes principales.",
        `Debes incluir exactamente estos ingredientes del usuario en la lista, sin sustituirlos ni ponerlos como alternativa: ${requiredIngredients.join(", ")}.`,
        "Devuelve de nuevo solo el JSON completo con el esquema solicitado.",
        `Receta anterior a corregir: ${JSON.stringify(recipe)}.`,
      ].join(" ");
      const correctedResponse = await this.analysisGateway.generateText(correctionPrompt);
      try {
        recipe = this.parseRecipe(correctedResponse.text);
      } catch {
        throw new BadGatewayException("Nano Chef no pudo corregir la receta con los ingredientes disponibles.");
      }

      if (!this.usesAllRequiredIngredients(recipe, requiredIngredients)) {
        throw new BadGatewayException("Nano Chef no pudo usar todos los ingredientes disponibles en la receta.");
      }
    }

    return {
      recipe,
      goalLabel: payload.goalLabel,
      model: providerResponse.model,
    };
  }

  private parseRecipe(raw: string | null | undefined): z.infer<typeof recipeSchema> {
    if (!raw) throw new Error("respuesta vacia");
    const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    return recipeSchema.parse(JSON.parse(cleaned));
  }

  private parseRequiredIngredients(ingredients?: string): string[] {
    if (!ingredients) return [];
    return [...new Set(ingredients.split(/[,;\n]+/).map((item) => item.trim()).filter(Boolean))];
  }

  /** Verifica que cada ingrediente aportado aparezca como ingrediente real, no como una sugerencia. */
  private usesAllRequiredIngredients(recipe: z.infer<typeof recipeSchema>, requiredIngredients: string[]): boolean {
    return requiredIngredients.every((required) => {
      const requiredTerms = this.ingredientTerms(required);
      if (!requiredTerms.length) return true;
      return recipe.ingredients.some((ingredient) => {
        const normalizedIngredient = this.normalizeIngredient(ingredient);
        const isMentioned = requiredTerms.every((term) => normalizedIngredient.includes(term));
        const isAlternative = /\b(puedes usar|sustitu[yi]|reemplaz[ae]|alternativa|en lugar de)\b/i.test(ingredient);
        return isMentioned && !isAlternative;
      });
    });
  }

  private ingredientTerms(value: string): string[] {
    const ignored = new Set(["de", "del", "la", "el", "los", "las", "un", "una", "y", "g", "gr", "gramos", "kg", "taza", "tazas", "cucharada", "cucharadas"]);
    return this.normalizeIngredient(value).split(" ").filter((term) => term.length > 1 && !ignored.has(term));
  }

  private normalizeIngredient(value: string): string {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .split(" ")
      .filter(Boolean)
      .map((word) => word.endsWith("s") && word.length > 3 ? word.slice(0, -1) : word)
      .join(" ");
  }

  async createTrainingPlan(payload: CreateTrainingPlanDto, pacienteId?: number) {
    const recordedFlags = await this.trainingSafety.getRecordedFlags(pacienteId);
    const safetyFlags = [...new Set([...(payload.safetyFlags ?? []), ...recordedFlags])];
    const needsMedicalClearance = safetyFlags.some(
      (flag) => flag === "high-risk-pregnancy" || flag === "cardiovascular-condition",
    );
    if (needsMedicalClearance) {
      throw new BadRequestException(
        "Por seguridad, consulta a tu médico antes de generar una rutina con Nano Entrenador.",
      );
    }
    const prompt = this.promptBuilder.buildTrainingPlan(
      payload.goalLabel,
      payload.level,
      payload.equipment,
      payload.limitations,
      safetyFlags,
    );
    // Una semana completa con ejercicios necesita más salida que una receta.
    const providerResponse = await this.analysisGateway.generateText(prompt, 2_200);
    if (!providerResponse.text) {
      throw new BadGatewayException("Nano Entrenador no devolvio una rutina util.");
    }

    try {
      const parsed = this.parseJsonCandidate(providerResponse.text);
      return {
        plan: trainingPlanSchema.parse(this.normalizeTrainingPlan(parsed)),
        goalLabel: payload.goalLabel,
        model: providerResponse.model,
      };
    } catch {
      throw new BadGatewayException("Nano Entrenador devolvio una rutina con formato invalido.");
    }
  }

  private parseJsonCandidate(raw: string): unknown {
    const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start < 0 || end <= start) {
      throw new Error("respuesta sin JSON");
    }
    return JSON.parse(cleaned.slice(start, end + 1));
  }

  private normalizeTrainingPlan(value: unknown): unknown {
    if (!value || typeof value !== "object") return value;
    const source = value as Record<string, unknown>;
    const rawDays = source.weeklyDays ?? source.weekly_days ?? source.days ?? source.planSemanal;
    const weeklyDays = Array.isArray(rawDays)
      ? rawDays.map((item) => {
          const day = item && typeof item === "object" ? item as Record<string, unknown> : {};
          const rawExercises = day.exercises ?? day.workout ?? day.ejercicios ?? [];
          return {
            day: day.day ?? day.dia ?? day.name ?? "Día",
            focus: day.focus ?? day.enfoque ?? day.description ?? "Entrenamiento",
            duration: day.duration ?? day.durationMinutes ?? day.duracion ?? "30 minutos",
            exercises: Array.isArray(rawExercises)
              ? rawExercises.map((exercise) => {
                  const item = exercise && typeof exercise === "object" ? exercise as Record<string, unknown> : {};
                  return {
                    name: item.name ?? item.nombre ?? "Ejercicio",
                    sets: item.sets ?? item.series ?? "3 series",
                    reps: item.reps ?? item.repetitions ?? item.repeticiones ?? "10 repeticiones",
                    rest: item.rest ?? item.restSeconds ?? item.descanso ?? "60 segundos",
                    notes: item.notes ?? item.notes ?? item.notas ?? "",
                  };
                })
              : [],
          };
        })
      : rawDays;

    return {
      title: source.title ?? source.name ?? source.nombre ?? "Rutina semanal",
      summary: source.summary ?? source.description ?? source.resumen ?? "Rutina personalizada de entrenamiento.",
      weeklyDays,
      nanoTip: source.nanoTip ?? source.tip ?? source.consejo ?? "Escucha a tu cuerpo y avanza gradualmente.",
    };
  }
}
