import { BadGatewayException } from "@nestjs/common";
import { NanoAnalysisParser } from "./nano-analysis.parser";

describe("NanoAnalysisParser", () => {
  const parser = new NanoAnalysisParser();

  it("normaliza variantes razonables del formato del proveedor", () => {
    const result = parser.parse(
      JSON.stringify({
        isFood: true,
        feedback:
          "El plato contiene nutrientes suficientes y una distribucion apropiada para una comida completa.",
        macros: {
          kcal: "510 kcal",
          carbs: "55 g",
          protein: "32 g",
          fat: "18 g",
        },
        micronutrients: {
          iron: { label: "Hierro", amount: "5 mg", percent: 28 },
          calcium: { label: "Calcio", amount: "180 mg", percent: 14 },
          potassium: {
            label: "Potasio",
            amount: "700 mg",
            percent: 15,
          },
        },
      }),
    );

    expect(result).toMatchObject({
      is_food: true,
      macronutrients: {
        calories: 510,
        carbohydrates_g: 55,
        protein_g: 32,
        fat_g: 18,
      },
    });
  });

  it("traduce una respuesta mal formada a un error de gateway", () => {
    expect(() => parser.parse("respuesta sin JSON")).toThrow(
      BadGatewayException,
    );
  });
});
