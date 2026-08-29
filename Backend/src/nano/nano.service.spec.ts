/**
 * @file Backend/src/nano/nano.service.spec.ts
 * @description TypeScript module implementation.
 */

import { BadRequestException } from "@nestjs/common";
import { AnalyzeMealDto } from "./dto/analyze-meal.dto";
import { CreateRecipeDto } from "./dto/create-recipe.dto";
import { MealAnalysisGateway } from "./meal-analysis.gateway";
import { NanoAnalysisParser } from "./nano-analysis.parser";
import { optimizeNanoImage } from "./nano-image.optimizer";
import { NanoPromptBuilder } from "./nano-prompt.builder";
import { NanoService } from "./nano.service";

jest.mock("./nano-image.optimizer", () => ({
  optimizeNanoImage: jest.fn(),
}));

const foodAnalysis = JSON.stringify({
  is_food: true,
  summary:
    "Este plato aporta una combinacion equilibrada de energia, proteina y fibra para el objetivo seleccionado.",
  macronutrients: {
    calories: 430,
    carbohydrates_g: 45,
    protein_g: 30,
    fat_g: 14,
    fiber_g: 8,
    sugar_g: 5,
  },
  micronutrients: [
    {
      key: "hierro",
      label: "Hierro",
      amount: "4 mg",
      dailyValuePercent: 22,
    },
    {
      key: "vitamina-c",
      label: "Vitamina C",
      amount: "35 mg",
      dailyValuePercent: 39,
    },
    {
      key: "potasio",
      label: "Potasio",
      amount: "600 mg",
      dailyValuePercent: 13,
    },
  ],
});

describe("NanoService", () => {
  const gateway: jest.Mocked<MealAnalysisGateway> = {
    analyze: jest.fn(),
    generateText: jest.fn(),
  };
  const promptBuilder = new NanoPromptBuilder();
  const parser = new NanoAnalysisParser();
  const service = new NanoService(gateway, promptBuilder, parser);
  const payload = {
    goalKey: "muscle-gain",
    goalLabel: "Ganar masa muscular",
    imageBase64: Buffer.from("fake image").toString("base64"),
    imageMimeType: "image/jpeg",
    userNote: "Despues de entrenar",
  } as AnalyzeMealDto;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(optimizeNanoImage).mockResolvedValue({
      buffer: Buffer.from("optimized"),
      mimeType: "image/webp",
      width: 100,
      height: 100,
      originalSizeBytes: 10,
      optimizedSizeBytes: 9,
    });
  });

  it("orquesta el analisis mediante el gateway inyectado", async () => {
    gateway.analyze.mockResolvedValue({
      text: foodAnalysis,
      model: "test-model",
    });

    const result = await service.analyzeMeal(payload);

    expect(gateway.analyze).toHaveBeenCalledWith({
      prompt: expect.stringContaining("Ganar masa muscular"),
      image: {
        buffer: Buffer.from("optimized"),
        mimeType: "image/webp",
      },
    });
    expect(result).toMatchObject({
      goalKey: "muscle-gain",
      model: "test-model",
      macronutrients: {
        calories: 430,
        proteinGrams: 30,
      },
    });
  });

  it("rechaza una respuesta que identifica contenido no alimentario", async () => {
    gateway.analyze.mockResolvedValue({
      text: JSON.stringify({
        is_food: false,
        rejection_reason: "La imagen no muestra comida identificable.",
      }),
      model: "test-model",
    });

    await expect(service.analyzeMeal(payload)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it("genera una receta solo a partir de ingredientes escritos", async () => {
    gateway.generateText.mockResolvedValue({
      text: "Nombre de la receta: Avena con fruta\nIngredientes: avena y banano",
      model: "test-model",
    });

    const result = await service.createRecipe({
      goalKey: "weight-loss",
      goalLabel: "Ligera y saciante",
      ingredients: "avena, banano",
      preferences: "sin azucar",
    } as CreateRecipeDto);

    expect(gateway.generateText).toHaveBeenCalledWith(
      expect.stringContaining("Ingredientes disponibles: avena, banano"),
    );
    expect(result).toMatchObject({
      recipe: expect.stringContaining("Avena con fruta"),
      goalLabel: "Ligera y saciante",
    });
  });
});
