/**
 * @file Backend/src/nano/nano-prompt.builder.ts
 * @description TypeScript module implementation.
 */

import { Injectable } from "@nestjs/common";

@Injectable()
export class NanoPromptBuilder {
  build(goalKey: string, goalLabel: string, userNote?: string): string {
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

  buildRecipe(
    goalKey: string,
    goalLabel: string,
    ingredients: string,
    preferences?: string,
  ): string {
    const goalContext = this.describeGoal(goalKey, goalLabel);
    const normalizedIngredients = this.normalizeOptionalNote(ingredients);
    const normalizedPreferences = this.normalizeOptionalNote(preferences);

    return [
      "Eres Nano Chef, un asistente de recetas saludables.",
      "Crea una receta practica en espanol usando solamente texto; no tienes imagenes ni debes pedirlas.",
      "No des diagnosticos clinicos. Si el objetivo es diabetes o embarazo, incluye una nota breve de precaucion razonable.",
      "Usa este formato claro con encabezados: Nombre de la receta, Porciones, Ingredientes, Preparacion numerada, Tiempo aproximado y Consejo de Nano.",
      "Propón alternativas sencillas si falta un ingrediente esencial, sin inventar que el usuario tiene ingredientes que no mencionó.",
      `Objetivo del usuario: ${goalLabel}.`,
      `Contexto del objetivo: ${goalContext}.`,
      `Ingredientes disponibles: ${normalizedIngredients ?? "No especificados"}.`,
      normalizedPreferences
        ? `Preferencias o restricciones: ${normalizedPreferences}.`
        : "No hay preferencias o restricciones adicionales.",
    ].join(" ");
  }

  private describeGoal(goalKey: string, goalLabel: string): string {
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

  private normalizeOptionalNote(
    value: string | null | undefined,
  ): string | null {
    if (typeof value !== "string") {
      return null;
    }

    const normalized = value.replace(/\s+/g, " ").trim();
    return normalized || null;
  }
}
