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
      goalKey === "diabetes"
        ? 'Si si es comida, devuelve exactamente este esquema: {"is_food":true,"summary":"string","macronutrients":{"calories":0,"carbohydrates_g":0,"protein_g":0,"fat_g":0,"fiber_g":0,"sugar_g":0},"micronutrients":[{"key":"string","label":"string","amount":"string","dailyValuePercent":0}],"glycemic_analysis":{"estimated_glycemic_index":0,"available_carbohydrates_g":0,"glycemic_load":0,"level":"medium","explanation":"string","suggestions":["string"]}}. En level usa solamente low, medium o high.'
        : 'Si si es comida, devuelve exactamente este esquema: {"is_food":true,"summary":"string","macronutrients":{"calories":0,"carbohydrates_g":0,"protein_g":0,"fat_g":0,"fiber_g":0,"sugar_g":0},"micronutrients":[{"key":"string","label":"string","amount":"string","dailyValuePercent":0}]}',
      "En summary escribe entre 55 y 80 palabras, indicando si la comida va bien para el objetivo, las calorias aproximadas y los macronutrientes mas relevantes, ademas de una mejora concreta si aplica.",
      "En micronutrients incluye de 4 a 6 vitaminas o minerales probables presentes en el plato con cantidad estimada y porcentaje diario aproximado.",
      goalKey === "diabetes"
        ? "Para diabetes es obligatorio estimar el índice glucémico predominante del plato y los carbohidratos disponibles. Calcula la carga glucémica con la fórmula (índice glucémico x carbohidratos disponibles en gramos) / 100. Clasifica low si es 10 o menos, medium entre 11 y 19, y high si es 20 o más. Explica qué ingredientes elevan o reducen la carga y ofrece de 2 a 4 ajustes concretos de porción, fibra, proteína o sustitución. Aclara que es una estimación visual y no sustituye la medición de glucosa ni la indicación profesional."
        : "No incluyas glycemic_analysis cuando el objetivo no sea diabetes.",
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
    ingredients?: string,
    preferences?: string,
    allowNanoRecommendations = false,
  ): string {
    const goalContext = this.describeGoal(goalKey, goalLabel);
    const normalizedIngredients = this.normalizeOptionalNote(ingredients);
    const normalizedPreferences = this.normalizeOptionalNote(preferences);

    return [
      "Eres Nano Chef, un asistente de recetas saludables.",
      "Crea una receta practica en espanol usando solamente texto; no tienes imagenes ni debes pedirlas.",
      "No des diagnosticos clinicos. Si el objetivo es diabetes o embarazo, incluye una nota breve de precaucion razonable.",
      "Responde solamente con JSON valido, sin markdown ni texto adicional, usando exactamente este esquema: {\"title\":\"string\",\"servings\":\"string\",\"time\":\"string\",\"ingredients\":[\"string\"],\"steps\":[\"string\"],\"nanoTip\":\"string\"}.",
      "Incluye entre 3 y 10 ingredientes y entre 3 y 7 pasos cortos de preparacion.",
      allowNanoRecommendations
        ? "El usuario no tiene ingredientes definidos. Elige ingredientes comunes, accesibles y adecuados al objetivo; incluyelos claramente en la receta."
        : "Usa cada ingrediente indicado como ingrediente principal de la receta. No lo reemplaces, no lo omitas ni lo presentes como sustituto de otro alimento. En la lista de ingredientes escribe el alimento que el usuario tiene; por ejemplo, si indica arroz blanco, escribe arroz blanco y nunca arroz integral con arroz blanco entre parentesis. Solo puedes anadir basicos de despensa indispensables, como agua, sal, pimienta o una pequena cantidad de aceite.",
      allowNanoRecommendations
        ? "Propón alternativas sencillas si falta un ingrediente esencial, sin inventar que el usuario tiene ingredientes que no mencionó."
        : "No propongas sustitutos: utiliza los ingredientes escritos por el usuario.",
      `Objetivo del usuario: ${goalLabel}.`,
      allowNanoRecommendations
        ? "Importante: como no hay ingredientes disponibles, debes recomendar una receta completa con ingredientes propuestos por ti y alineados al objetivo."
        : "",
      `Contexto del objetivo: ${goalContext}.`,
      `Ingredientes disponibles: ${normalizedIngredients ?? "No especificados"}.`,
      normalizedPreferences
        ? `Preferencias o restricciones: ${normalizedPreferences}.`
        : "No hay preferencias o restricciones adicionales.",
    ].join(" ");
  }

  buildTrainingPlan(
    goalLabel: string,
    level: string,
    equipment?: string,
    limitations?: string,
    safetyFlags: string[] = [],
  ): string {
    const normalizedEquipment = this.normalizeOptionalNote(equipment);
    const normalizedLimitations = this.normalizeOptionalNote(limitations);
    return [
      "Eres Nano Entrenador, un asistente de entrenamiento responsable.",
      "Crea una rutina semanal realista en español. No uses imágenes.",
      "No diagnostiques lesiones. Recomienda detenerse si hay dolor agudo y consultar a un profesional cuando aplique.",
      "Responde solamente con JSON válido y sin markdown usando exactamente este esquema: {\"title\":\"string\",\"summary\":\"string\",\"weeklyDays\":[{\"day\":\"string\",\"focus\":\"string\",\"duration\":\"string\",\"exercises\":[{\"name\":\"string\",\"sets\":\"string\",\"reps\":\"string\",\"rest\":\"string\",\"notes\":\"string\"}]}],\"nanoTip\":\"string\"}.",
      "Incluye exactamente 7 días. En los días de descanso usa un arreglo de ejercicios vacío y explica brevemente la recuperación en focus.",
      `Objetivo: ${goalLabel}.`,
      `Nivel: ${level}.`,
      `Equipo disponible: ${normalizedEquipment ?? "sin equipo especial"}.`,
      `Limitaciones o preferencias: ${normalizedLimitations ?? "ninguna indicada"}.`,
      safetyFlags.some((flag) => flag === "injury" || flag === "pain")
        ? "Seguridad obligatoria: crea únicamente ejercicios de bajo impacto. No incluyas saltos, carrera, burpees, pliometría ni movimientos que aumenten el dolor."
        : "",
    ].join(" ");
  }

  buildCalmMissions(
    emotion: string | undefined,
    stressLevel: number,
    anxietyLevel: number,
    context?: string,
  ): string {
    const normalizedContext = this.normalizeOptionalNote(context);
    return [
      "Eres Nano Calma, un acompañante de bienestar emocional responsable.",
      "Genera exactamente 3 misiones pequeñas, sencillas y realizables ahora mismo para ayudar a reducir la tensión cotidiana.",
      "Las misiones no son terapia, diagnóstico ni tratamiento. No sugieras medicamentos, alcohol, suplementos, ejercicio intenso, conducir ni actividades peligrosas.",
      "Incluye respiración suave, conexión con el entorno, descanso breve, hidratación o contacto con una persona de confianza según el contexto.",
      "Cada misión debe durar entre 1 y 10 minutos y tener una instrucción concreta de una o dos frases.",
      "Si el contexto menciona autolesión, suicidio, peligro, violencia o una emergencia, no propongas un reto: indica buscar ayuda inmediata de emergencias y de una persona de confianza.",
      'Responde solamente con JSON válido, sin markdown, usando exactamente este esquema: {"intro":"string","missions":[{"title":"string","instruction":"string","durationMinutes":1,"category":"respiracion|movimiento|conexion|descanso|entorno"}],"safetyNote":"string"}.',
      `Emoción indicada: ${emotion ?? "no especificada"}.`,
      `Estrés: ${stressLevel} de 5. Ansiedad: ${anxietyLevel} de 5.`,
      `Contexto opcional: ${normalizedContext ?? "sin contexto adicional"}.`,
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
