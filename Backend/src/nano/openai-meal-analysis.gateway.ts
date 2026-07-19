import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import https from "node:https";
import {
  MealAnalysisGateway,
  MealAnalysisGatewayRequest,
  MealAnalysisGatewayResponse,
} from "./meal-analysis.gateway";

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

@Injectable()
export class OpenAiMealAnalysisGateway implements MealAnalysisGateway {
  private readonly apiKey: string | null;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey =
      this.configService.get<string>("OPENAI_API_KEY")?.trim() ?? null;
    this.model =
      this.configService.get<string>("OPENAI_VISION_MODEL")?.trim() ||
      "gpt-4.1-mini";
  }

  async analyze(
    request: MealAnalysisGatewayRequest,
  ): Promise<MealAnalysisGatewayResponse> {
    if (!this.apiKey) {
      throw new ServiceUnavailableException(
        "OPENAI_API_KEY no esta configurada en el backend.",
      );
    }

    const response = await this.createResponse({
      model: this.model,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: request.prompt,
            },
            {
              type: "input_image",
              image_url: `data:${request.image.mimeType};base64,${request.image.buffer.toString("base64")}`,
            },
          ],
        },
      ],
      max_output_tokens: 520,
    });

    return {
      text: this.extractText(response),
      model: this.model,
    };
  }

  private extractText(response: OpenAIResponsePayload): string {
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

  private async createResponse(
    body: Record<string, unknown>,
  ): Promise<OpenAIResponsePayload> {
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
            } catch {
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
