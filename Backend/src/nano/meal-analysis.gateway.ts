export const MEAL_ANALYSIS_GATEWAY = Symbol("MEAL_ANALYSIS_GATEWAY");

export type MealAnalysisGatewayRequest = {
  prompt: string;
  image: {
    buffer: Buffer;
    mimeType: string;
  };
};

export type MealAnalysisGatewayResponse = {
  text: string;
  model: string;
};

/**
 * Puerto de infraestructura utilizado para analizar una comida.
 *
 * El caso de uso depende de este contrato y no del SDK, transporte o
 * proveedor concreto que procese la imagen.
 */
export interface MealAnalysisGateway {
  analyze(
    request: MealAnalysisGatewayRequest,
  ): Promise<MealAnalysisGatewayResponse>;
}
