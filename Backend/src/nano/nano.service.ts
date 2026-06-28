import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import https from "node:https";
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
              text: this.buildPrompt(payload.goalKey, payload.goalLabel),
            },
            {
              type: "input_image",
              image_url: `data:${imageMimeType};base64,${imageBuffer.toString("base64")}`,
            },
          ],
        },
      ],
      max_output_tokens: 220,
    });

    const rawFeedback = this.extractTextFromResponse(response);
    if (!rawFeedback) {
      throw new BadGatewayException(
        "OpenAI no devolvio una recomendacion util para esta imagen.",
      );
    }

    const normalized = this.normalizeToEightyWords(rawFeedback);

    return {
      feedback: normalized.text,
      goalKey: payload.goalKey,
      goalLabel: payload.goalLabel,
      wordCount: normalized.wordCount,
      model: this.model,
    };
  }

  /**
   * Build prompt.
   * @param goalKey Identificador del objetivo seleccionado.
   * @param goalLabel Etiqueta visible del objetivo seleccionado.
   * @returns Resultado de la operacion.
   */
  private buildPrompt(goalKey: string, goalLabel: string) {
    const goalContext = this.describeGoal(goalKey, goalLabel);
    return [
      "Eres un asistente de nutricion llamado Nano.",
      "Analiza una foto de comida y responde en espanol.",
      "La respuesta debe tener exactamente 80 palabras.",
      "No uses listas, encabezados, markdown ni comillas.",
      "Primero indica brevemente si la comida va bien para el objetivo y luego sugiere cambios concretos si hacen falta.",
      "No inventes gramos exactos ni diagnosticos clinicos.",
      `Objetivo del usuario: ${goalLabel}.`,
      `Contexto del objetivo: ${goalContext}.`,
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
  private normalizeToEightyWords(text: string) {
    const cleaned = text
      .replace(/\s+([,.!?;:])/g, "$1")
      .replace(/\s+/g, " ")
      .trim();
    const words = cleaned.split(/\s+/).filter(Boolean);

    if (words.length <= 80) {
      return {
        text: cleaned,
        wordCount: words.length,
      };
    }

    let trimmed = words.slice(0, 80).join(" ");
    trimmed = trimmed.replace(/\s+([,.!?;:])/g, "$1").trim();
    if (!/[.!?]$/.test(trimmed)) {
      trimmed = `${trimmed}.`;
    }

    return {
      text: trimmed,
      wordCount: 80,
    };
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
