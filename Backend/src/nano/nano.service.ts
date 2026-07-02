import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import https from "node:https";
import { z } from "zod";
import { decodeBase64Image, validateImageMimeType } from "../common/utils/base64-image.util";
import { AnalyzeMealDto } from "./dto/analyze-meal.dto";

type OpenAIResponseContent = {
  type?: string;
  text?: string;
};

type OpenAIResponseItem = {
  content?: OpenAIResponseContent[];
};

type OpenAIResponsePayload = {
  output?: OpenAIResponseItem[];
  error?: {
    message?: string;
  };
};

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

/**
 * Implementa la logica de negocio del dominio nano.
 */
@Injectable()
export class NanoService {
  private readonly apiKey: string | null;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>("OPENAI_API_KEY")?.trim() ?? null;
    this.model =
      this.configService.get<string>("OPENAI_VISION_MODEL")?.trim() ||
      "gpt-4.1-mini";
  }

  /**
   * Analyze meal.
   * @param payload Datos validados que recibe la operacion.
   * @returns Resultado de la operacion.
   */
  async analyzeMeal(payload: AnalyzeMealDto) {
    if (!this.apiKey) {
      throw new ServiceUnavailableException(
        "OPENAI_API_KEY no esta configurada en el backend.",
      );
    }

    const imageBuffer = decodeBase64Image(payload.imageBase64, "imageBase64");
    if (!imageBuffer) {
      throw new BadRequestException("imageBase64 no contiene datos validos");
    }

    const imageMimeType =
      validateImageMimeType(payload.imageMimeType, "imageMimeType") ||
      "image/jpeg";

    const response = await this.createOpenAIResponse({
      model: this.model,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: this.buildPrompt(payload.goalKey, payload.goalLabel, payload.userNote),
            },
            {
              type: "input_image",
              image_url: `data:${imageMimeType};base64,${imageBuffer.toString("base64")}`,
            },
          ],
        },
      ],
      max_output_tokens: 520,
    });

    const rawAnalysis = this.extractTextFromResponse(response);
    if (!rawAnalysis) {
      throw new BadGatewayException(
        "OpenAI no devolvio una recomendacion util para esta imagen.",
      );
    }

    const analysis = this.parseStructuredAnalysis(rawAnalysis);
    if (!analysis.is_food) {
      throw new BadRequestException(analysis.rejection_reason);
    }

    const summary = this.normalizeSummary(analysis.summary);

    return {
      feedback: summary,
      goalKey: payload.goalKey,
      goalLabel: payload.goalLabel,
      model: this.model,
      macronutrients: {
        calories: this.roundNumber(analysis.macronutrients.calories, 0),
        carbohydratesGrams: this.roundNumber(analysis.macronutrients.carbohydrates_g, 1),
        proteinGrams: this.roundNumber(analysis.macronutrients.protein_g, 1),
        fatGrams: this.roundNumber(analysis.macronutrients.fat_g, 1),
        fiberGrams: this.roundNumber(analysis.macronutrients.fiber_g ?? 0, 1),
        sugarGrams: this.roundNumber(analysis.macronutrients.sugar_g ?? 0, 1),
      },
      macroDistribution: this.buildMacroDistribution(analysis.macronutrients),
      micronutrients: analysis.micronutrients.map((item, index) => ({
        key: this.slugify(item.key || item.label || `micronutriente-${index + 1}`),
        label: item.label,
        amount: item.amount,
        dailyValuePercent: this.roundNumber(item.dailyValuePercent, 0),
      })),
    };
  }

  /**
   * Build prompt.
   * @param goalKey Identificador del objetivo seleccionado.
   * @param goalLabel Etiqueta visible del objetivo seleccionado.
   * @returns Resultado de la operacion.
   */
  private buildPrompt(goalKey: string, goalLabel: string, userNote?: string) {
    const goalContext = this.describeGoal(goalKey, goalLabel);
    const normalizedUserNote = this.normalizeOptionalNote(userNote);
    return [
      "Eres un asistente de nutricion llamado Nano.",
      "Analiza una foto de comida y responde en espanol con JSON valido solamente.",
      "Primero valida si la imagen muestra comida o bebida consumible por humanos de forma clara.",
      'Si la imagen no muestra comida o no se puede identificar con suficiente claridad, devuelve exactamente este esquema: {"is_food":false,"rejection_reason":"Solo se pueden analizar fotos claras de comida o bebida."}',
      "No uses markdown, texto adicional, comillas triples ni bloques de codigo.",
      "Haz estimaciones aproximadas y conservadoras a partir de lo visible en la imagen.",
      "No des diagnosticos clinicos ni afirmes precision absoluta.",
      'Si si es comida, devuelve exactamente este esquema: {"is_food":true,"summary":"string","macronutrients":{"calories":0,"carbohydrates_g":0,"protein_g":0,"fat_g":0,"fiber_g":0,"sugar_g":0},"micronutrients":[{"key":"string","label":"string","amount":"string","dailyValuePercent":0}]}',
      "En summary escribe entre 55 y 80 palabras, indicando si la comida va bien para el objetivo, las calorias aproximadas y los macronutrientes mas relevantes, ademas de una mejora concreta si aplica.",
      "En micronutrients incluye de 4 a 6 vitaminas o minerales probables presentes en el plato con cantidad estimada y porcentaje diario aproximado.",
      `Objetivo del usuario: ${goalLabel}.`,
      `Contexto del objetivo: ${goalContext}.`,
      normalizedUserNote
        ? `Nota opcional del usuario sobre la comida: ${normalizedUserNote}. Considerala solo si es coherente con la imagen.`
        : "No hay nota adicional del usuario.",
    ].join(" ");
  }

  /**
   * Describe goal.
   * @param goalKey Identificador del objetivo seleccionado.
   * @param goalLabel Etiqueta visible del objetivo seleccionado.
   * @returns Resultado de la operacion.
   */
  private describeGoal(goalKey: string, goalLabel: string) {
    switch (goalKey) {
      case "weight-loss":
        return "Prioriza saciedad, porciones razonables, proteina, fibra y control de calorias.";
      case "diabetes":
        return "Prioriza control de azucar, carbohidratos de mejor calidad, fibra y equilibrio del plato.";
      case "muscle-gain":
        return "Prioriza energia suficiente, proteina, carbohidratos utiles y calidad nutricional.";
      case "pregnancy":
        return "Prioriza seguridad alimentaria, variedad, hierro, proteina y alimentos adecuados para embarazo.";
      default:
        return `Da recomendaciones practicas alineadas con ${goalLabel}.`;
    }
  }

  /**
   * Extract text from response.
   * @param response Respuesta del proveedor.
   * @returns Resultado de la operacion.
   */
  private extractTextFromResponse(response: OpenAIResponsePayload) {
    const chunks: string[] = [];
    for (const item of response.output ?? []) {
      for (const content of item.content ?? []) {
        if (content.type === "output_text" && content.text) {
          chunks.push(content.text);
        }
      }
    }
    return chunks.join(" ").replace(/\s+/g, " ").trim();
  }

  /**
   * Normalize to eighty words.
   * @param text Texto devuelto por el proveedor.
   * @returns Resultado de la operacion.
   */
  private parseStructuredAnalysis(rawText: string) {
    const cleaned = this.cleanJsonCandidate(rawText);

    try {
      const parsed = JSON.parse(cleaned) as unknown;
      return nanoAnalysisSchema.parse(this.normalizeAnalysisShape(parsed));
    } catch (error) {
      throw new BadGatewayException(
        "Nano devolvio un analisis con formato invalido.",
      );
    }
  }

  /**
   * Normalize analysis shape.
   * @param value Valor devuelto por el proveedor.
   * @returns Resultado de la operacion.
   */
  private normalizeAnalysisShape(value: unknown) {
    const source = this.asRecord(value);
    const rejectionReason = this.pickString(source, [
      "rejection_reason",
      "rejectionReason",
      "reason",
      "message",
    ]);
    const isFood =
      this.pickBoolean(source, ["is_food", "isFood", "food_detected", "foodDetected"]) ??
      (rejectionReason ? false : null) ??
      true;

    if (!isFood) {
      return {
        is_food: false,
        rejection_reason:
          rejectionReason ?? "Solo se pueden analizar fotos claras de comida o bebida.",
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
      this.pickNumber(macroSource, ["sugar_g", "sugar", "azucar", "azucares"]) ??
      0;
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

  /**
   * Normalize micronutrients.
   * @param value Valor devuelto por el proveedor.
   * @returns Resultado de la operacion.
   */
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
            ]) ?? this.extractNumberFromText(amount) ?? 0;

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
          ]) ?? this.extractNumberFromText(rawAmount) ?? 0;

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

  /**
   * Build macro distribution.
   * @param macronutrients Macronutrientes estimados.
   * @returns Resultado de la operacion.
   */
  private buildMacroDistribution(macronutrients: {
    carbohydrates_g: number;
    protein_g: number;
    fat_g: number;
  }) {
    const carbohydrateCalories = Math.max(macronutrients.carbohydrates_g, 0) * 4;
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

  /**
   * Clean json candidate.
   * @param rawText Texto devuelto por el proveedor.
   * @returns Resultado de la operacion.
   */
  private cleanJsonCandidate(rawText: string) {
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

  /**
   * Normalize summary.
   * @param text Texto devuelto por el proveedor.
   * @returns Resultado de la operacion.
   */
  private normalizeSummary(text: string) {
    return text
      .replace(/\s+([,.!?;:])/g, "$1")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Normalize optional note.
   * @param value Texto libre del usuario.
   * @returns Resultado de la operacion.
   */
  private normalizeOptionalNote(value: string | null | undefined) {
    if (typeof value !== "string") {
      return null;
    }

    const normalized = value.replace(/\s+/g, " ").trim();
    return normalized || null;
  }

  /**
   * Round number.
   * @param value Valor a redondear.
   * @param decimals Cantidad de decimales.
   * @returns Resultado de la operacion.
   */
  private roundNumber(value: number, decimals: number) {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
  }

  /**
   * As record.
   * @param value Valor a normalizar.
   * @returns Resultado de la operacion.
   */
  private asRecord(value: unknown) {
    return value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  }

  /**
   * Pick record.
   * @param source Fuente de datos.
   * @param keys Llaves candidatas.
   * @returns Resultado de la operacion.
   */
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

  /**
   * Pick string.
   * @param source Fuente de datos.
   * @param keys Llaves candidatas.
   * @returns Resultado de la operacion.
   */
  private pickString(source: Record<string, unknown>, keys: string[]) {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }

    return null;
  }

  /**
   * Pick number.
   * @param source Fuente de datos.
   * @param keys Llaves candidatas.
   * @returns Resultado de la operacion.
   */
  private pickNumber(source: Record<string, unknown>, keys: string[]) {
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

  /**
   * Pick boolean.
   * @param source Fuente de datos.
   * @param keys Llaves candidatas.
   * @returns Resultado de la operacion.
   */
  private pickBoolean(source: Record<string, unknown>, keys: string[]) {
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

  /**
   * Extract number from text.
   * @param value Texto a normalizar.
   * @returns Resultado de la operacion.
   */
  private extractNumberFromText(value: string | null | undefined) {
    if (!value) {
      return null;
    }

    const normalized = Number(value.replace(/[^0-9.-]+/g, ""));
    return Number.isFinite(normalized) ? normalized : null;
  }

  /**
   * Humanize label.
   * @param value Texto a normalizar.
   * @returns Resultado de la operacion.
   */
  private humanizeLabel(value: string) {
    const cleaned = value
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return cleaned
      ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
      : "Micronutriente";
  }

  /**
   * Slugify.
   * @param value Texto a normalizar.
   * @returns Resultado de la operacion.
   */
  private slugify(value: string) {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);
  }

  /**
   * Create OpenAI response.
   * @param body Cuerpo de la peticion hacia OpenAI.
   * @returns Resultado de la operacion.
   */
  private async createOpenAIResponse(body: Record<string, unknown>) {
    const payload = JSON.stringify(body);

    return new Promise<OpenAIResponsePayload>((resolve, reject) => {
      const request = https.request(
        "https://api.openai.com/v1/responses",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(payload),
          },
        },
        (response) => {
          const chunks: Buffer[] = [];

          response.on("data", (chunk) => {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          });

          response.on("end", () => {
            const raw = Buffer.concat(chunks).toString("utf8");
            let parsed: OpenAIResponsePayload | null = null;

            try {
              parsed = raw ? (JSON.parse(raw) as OpenAIResponsePayload) : null;
            } catch (error) {
              reject(
                new BadGatewayException(
                  "No se pudo interpretar la respuesta de OpenAI.",
                ),
              );
              return;
            }

            const statusCode = response.statusCode ?? 500;
            if (statusCode < 200 || statusCode >= 300) {
              reject(
                new BadGatewayException(
                  parsed?.error?.message ||
                    `OpenAI devolvio un error HTTP ${statusCode}.`,
                ),
              );
              return;
            }

            resolve(parsed ?? {});
          });
        },
      );

      request.on("error", (error) => {
        reject(
          new BadGatewayException(
            error.message || "No se pudo conectar con OpenAI.",
          ),
        );
      });

      request.write(payload);
      request.end();
    });
  }
}
