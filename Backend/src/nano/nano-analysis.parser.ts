import { BadGatewayException, Injectable } from "@nestjs/common";
import { z } from "zod";

const numericField = (max: number) =>
  z.preprocess((value) => {
    if (typeof value === "number") {
      return value;
    }
    if (typeof value === "string") {
      const normalized = Number(value.replace(/[^0-9.-]+/g, ""));
      return Number.isFinite(normalized) ? normalized : value;
    }
    return value;
  }, z.number().finite().min(0).max(max));

const nanoAnalysisSchema = z.discriminatedUnion("is_food", [
  z.object({
    is_food: z.literal(true),
    summary: z.string().trim().min(20).max(700),
    macronutrients: z.object({
      calories: numericField(5000),
      carbohydrates_g: numericField(1000),
      protein_g: numericField(1000),
      fat_g: numericField(1000),
      fiber_g: numericField(300).optional().default(0),
      sugar_g: numericField(300).optional().default(0),
    }),
    micronutrients: z
      .array(
        z.object({
          key: z.string().trim().min(2).max(40),
          label: z.string().trim().min(2).max(60),
          amount: z.string().trim().min(1).max(40),
          dailyValuePercent: numericField(300),
        }),
      )
      .min(3)
      .max(8),
  }),
  z.object({
    is_food: z.literal(false),
    rejection_reason: z.string().trim().min(10).max(220),
  }),
]);

export type NanoAnalysis = z.infer<typeof nanoAnalysisSchema>;
export type NanoFoodAnalysis = Extract<NanoAnalysis, { is_food: true }>;

export type NanoMealResultContext = {
  goalKey: string;
  goalLabel: string;
  model: string;
};

@Injectable()
export class NanoAnalysisParser {
  parse(rawText: string): NanoAnalysis {
    const cleaned = this.cleanJsonCandidate(rawText);

    try {
      const parsed = JSON.parse(cleaned) as unknown;
      return nanoAnalysisSchema.parse(this.normalizeAnalysisShape(parsed));
    } catch {
      throw new BadGatewayException(
        "Nano devolvio un analisis con formato invalido.",
      );
    }
  }

  toMealResult(analysis: NanoFoodAnalysis, context: NanoMealResultContext) {
    const summary = this.normalizeSummary(analysis.summary);

    return {
      feedback: summary,
      goalKey: context.goalKey,
      goalLabel: context.goalLabel,
      model: context.model,
      macronutrients: {
        calories: this.roundNumber(analysis.macronutrients.calories, 0),
        carbohydratesGrams: this.roundNumber(
          analysis.macronutrients.carbohydrates_g,
          1,
        ),
        proteinGrams: this.roundNumber(analysis.macronutrients.protein_g, 1),
        fatGrams: this.roundNumber(analysis.macronutrients.fat_g, 1),
        fiberGrams: this.roundNumber(
          analysis.macronutrients.fiber_g ?? 0,
          1,
        ),
        sugarGrams: this.roundNumber(
          analysis.macronutrients.sugar_g ?? 0,
          1,
        ),
      },
      macroDistribution: this.buildMacroDistribution(
        analysis.macronutrients,
      ),
      micronutrients: analysis.micronutrients.map((item, index) => ({
        key: this.slugify(
          item.key || item.label || `micronutriente-${index + 1}`,
        ),
        label: item.label,
        amount: item.amount,
        dailyValuePercent: this.roundNumber(item.dailyValuePercent, 0),
      })),
    };
  }

  private normalizeAnalysisShape(value: unknown) {
    const source = this.asRecord(value);
    const rejectionReason = this.pickString(source, [
      "rejection_reason",
      "rejectionReason",
      "reason",
      "message",
    ]);
    const isFood =
      this.pickBoolean(source, [
        "is_food",
        "isFood",
        "food_detected",
        "foodDetected",
      ]) ??
      (rejectionReason ? false : null) ??
      true;

    if (!isFood) {
      return {
        is_food: false,
        rejection_reason:
          rejectionReason ??
          "Solo se pueden analizar fotos claras de comida o bebida.",
      };
    }

    const macroSource =
      this.pickRecord(source, [
        "macronutrients",
        "macros",
        "nutrition",
        "nutrients",
      ]) ?? source;

    const carbohydrates =
      this.pickNumber(macroSource, [
        "carbohydrates_g",
        "carbohydrates",
        "carbs_g",
        "carbs",
        "hidratos",
      ]) ?? 0;
    const protein =
      this.pickNumber(macroSource, [
        "protein_g",
        "protein",
        "proteins",
        "proteina",
      ]) ?? 0;
    const fat =
      this.pickNumber(macroSource, ["fat_g", "fat", "fats", "grasas"]) ?? 0;
    const fiber =
      this.pickNumber(macroSource, ["fiber_g", "fiber", "fibra"]) ?? 0;
    const sugar =
      this.pickNumber(macroSource, [
        "sugar_g",
        "sugar",
        "azucar",
        "azucares",
      ]) ?? 0;
    const estimatedCalories = carbohydrates * 4 + protein * 4 + fat * 9;
    const calories =
      this.pickNumber(macroSource, [
        "calories",
        "kcal",
        "energy",
        "energy_kcal",
        "calorias",
      ]) ?? estimatedCalories;

    return {
      is_food: true,
      summary:
        this.pickString(source, [
          "summary",
          "feedback",
          "recommendation",
          "message",
          "analysis",
        ]) ?? "",
      macronutrients: {
        calories,
        carbohydrates_g: carbohydrates,
        protein_g: protein,
        fat_g: fat,
        fiber_g: fiber,
        sugar_g: sugar,
      },
      micronutrients: this.normalizeMicronutrients(
        source.micronutrients ??
          source.micros ??
          source.vitamins ??
          source.minerals,
      ),
    };
  }

  private normalizeMicronutrients(value: unknown) {
    if (Array.isArray(value)) {
      return value
        .map((item, index) => {
          const record = this.asRecord(item);
          const label =
            this.pickString(record, ["label", "name", "title"]) ??
            `Micronutriente ${index + 1}`;
          const amount =
            this.pickString(record, ["amount", "quantity", "value"]) ?? "N/D";
          const dailyValuePercent =
            this.pickNumber(record, [
              "dailyValuePercent",
              "daily_value_percent",
              "percent",
              "percentage",
            ]) ??
            this.extractNumberFromText(amount) ??
            0;

          return {
            key:
              this.pickString(record, ["key", "id"]) ??
              this.slugify(label || `micronutriente-${index + 1}`),
            label,
            amount,
            dailyValuePercent,
          };
        })
        .slice(0, 8);
    }

    const record = this.asRecord(value);
    return Object.entries(record)
      .map(([key, item], index) => {
        const child = this.asRecord(item);
        const label =
          this.pickString(child, ["label", "name", "title"]) ??
          this.humanizeLabel(key);
        const rawAmount =
          this.pickString(child, ["amount", "quantity", "value"]) ??
          (typeof item === "string" ? item : null);
        const dailyValuePercent =
          this.pickNumber(child, [
            "dailyValuePercent",
            "daily_value_percent",
            "percent",
            "percentage",
          ]) ??
          this.extractNumberFromText(rawAmount) ??
          0;

        return {
          key: this.slugify(key || `micronutriente-${index + 1}`),
          label,
          amount: rawAmount ?? `${this.roundNumber(dailyValuePercent, 0)}%`,
          dailyValuePercent,
        };
      })
      .filter((item) => item.label && item.amount)
      .slice(0, 8);
  }

  private buildMacroDistribution(macronutrients: {
    carbohydrates_g: number;
    protein_g: number;
    fat_g: number;
  }) {
    const carbohydrateCalories =
      Math.max(macronutrients.carbohydrates_g, 0) * 4;
    const proteinCalories = Math.max(macronutrients.protein_g, 0) * 4;
    const fatCalories = Math.max(macronutrients.fat_g, 0) * 9;
    const totalCalories =
      carbohydrateCalories + proteinCalories + fatCalories;

    if (totalCalories <= 0) {
      return {
        carbohydratesPercent: 0,
        proteinPercent: 0,
        fatPercent: 0,
      };
    }

    const rawPercentages = [
      (carbohydrateCalories / totalCalories) * 100,
      (proteinCalories / totalCalories) * 100,
      (fatCalories / totalCalories) * 100,
    ];
    const rounded = rawPercentages.map((value) => Math.floor(value));
    let remainder = 100 - rounded.reduce((sum, value) => sum + value, 0);
    const ranked = rawPercentages
      .map((value, index) => ({ index, decimal: value - Math.floor(value) }))
      .sort((left, right) => right.decimal - left.decimal);

    for (let index = 0; index < ranked.length && remainder > 0; index += 1) {
      rounded[ranked[index].index] += 1;
      remainder -= 1;
    }

    return {
      carbohydratesPercent: rounded[0],
      proteinPercent: rounded[1],
      fatPercent: rounded[2],
    };
  }

  private cleanJsonCandidate(rawText: string): string {
    const withoutFence = rawText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const firstBrace = withoutFence.indexOf("{");
    const lastBrace = withoutFence.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return withoutFence.slice(firstBrace, lastBrace + 1);
    }
    return withoutFence;
  }

  private normalizeSummary(text: string): string {
    return text
      .replace(/\s+([,.!?;:])/g, "$1")
      .replace(/\s+/g, " ")
      .trim();
  }

  private roundNumber(value: number, decimals: number): number {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
  }

  private asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  }

  private pickRecord(
    source: Record<string, unknown>,
    keys: string[],
  ): Record<string, unknown> | null {
    for (const key of keys) {
      const value = source[key];
      if (value && typeof value === "object" && !Array.isArray(value)) {
        return value as Record<string, unknown>;
      }
    }
    return null;
  }

  private pickString(
    source: Record<string, unknown>,
    keys: string[],
  ): string | null {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }
    return null;
  }

  private pickNumber(
    source: Record<string, unknown>,
    keys: string[],
  ): number | null {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === "number" && Number.isFinite(value)) {
        return value;
      }
      if (typeof value === "string") {
        const parsed = this.extractNumberFromText(value);
        if (parsed !== null) {
          return parsed;
        }
      }
    }
    return null;
  }

  private pickBoolean(
    source: Record<string, unknown>,
    keys: string[],
  ): boolean | null {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === "boolean") {
        return value;
      }
      if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (["true", "si", "sí", "yes"].includes(normalized)) {
          return true;
        }
        if (["false", "no"].includes(normalized)) {
          return false;
        }
      }
    }
    return null;
  }

  private extractNumberFromText(
    value: string | null | undefined,
  ): number | null {
    if (!value) {
      return null;
    }
    const normalized = Number(value.replace(/[^0-9.-]+/g, ""));
    return Number.isFinite(normalized) ? normalized : null;
  }

  private humanizeLabel(value: string): string {
    const cleaned = value
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return cleaned
      ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
      : "Micronutriente";
  }

  private slugify(value: string): string {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);
  }
}
