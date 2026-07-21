import { createZodDto } from "nestjs-zod";
import { z } from "zod";

const estadoEmbarazoSchema = z.enum([
  "activo",
  "finalizado",
  "perdida gestacional",
  "traslado",
]);

const embarazoFields = {
  pacienteId: z.number().int().positive(),
  fechainicio: z.coerce.date(),
  fechaprobableparto: z.coerce.date(),
  metodoCalculoFpp: z.string().trim().min(1).max(80),
  fechaPrimerUltrasonido: z.coerce.date().nullable().optional(),
  edadGestacionalPrimerUsSemanas: z
    .number()
    .int()
    .min(0)
    .max(45)
    .nullable()
    .optional(),
  edadGestacionalPrimerUsDias: z
    .number()
    .int()
    .min(0)
    .max(6)
    .nullable()
    .optional(),
  numeroFetos: z.number().int().min(1).max(20),
  embarazoPlanificado: z.boolean(),
  embarazosAnteriores: z.number().int().min(0).default(0),
  partosAnteriores: z.number().int().min(0).default(0),
  abortosAnteriores: z.number().int().min(0).default(0),
  cesareasAnteriores: z.number().int().min(0).default(0),
  grupoSanguineo: z.enum(["A", "B", "AB", "O"]).nullable().optional(),
  factorRh: z.enum(["positivo", "negativo"]).nullable().optional(),
  antecedentesRelevantes: z.string().trim().max(4000).nullable().optional(),
  medicoResponsable: z.string().trim().max(150).nullable().optional(),
  centroMedico: z.string().trim().max(200).nullable().optional(),
  estado: estadoEmbarazoSchema.default("activo"),
  creadopor: z.string().nullable().optional(),
  creadoen: z.coerce.date().optional(),
  modificadopor: z.string().nullable().optional(),
  modificadoen: z.coerce.date().nullable().optional(),
};

type PregnancyDateFields = {
  fechainicio?: Date;
  fechaprobableparto?: Date;
  fechaPrimerUltrasonido?: Date | null;
  edadGestacionalPrimerUsSemanas?: number | null;
  edadGestacionalPrimerUsDias?: number | null;
};

const validatePregnancyDates = (
  value: PregnancyDateFields,
  context: z.RefinementCtx,
) => {
  if (
    value.fechainicio &&
    value.fechaprobableparto &&
    value.fechaprobableparto <= value.fechainicio
  ) {
    context.addIssue({
      code: "custom",
      path: ["fechaprobableparto"],
      message: "la FPP debe ser posterior a la FUM",
    });
  }

  const hasUltrasoundAge =
    (value.edadGestacionalPrimerUsSemanas !== null &&
      value.edadGestacionalPrimerUsSemanas !== undefined) ||
    (value.edadGestacionalPrimerUsDias !== null &&
      value.edadGestacionalPrimerUsDias !== undefined);
  if (hasUltrasoundAge && !value.fechaPrimerUltrasonido) {
    context.addIssue({
      code: "custom",
      path: ["fechaPrimerUltrasonido"],
      message: "indica la fecha del primer ultrasonido",
    });
  }
  if (
    value.fechaPrimerUltrasonido &&
    (value.edadGestacionalPrimerUsSemanas === null ||
      value.edadGestacionalPrimerUsSemanas === undefined)
  ) {
    context.addIssue({
      code: "custom",
      path: ["edadGestacionalPrimerUsSemanas"],
      message: "indica las semanas de gestación del primer ultrasonido",
    });
  }
};

/**
 * Valida la creación de un registro obstétrico de embarazo.
 * `fechainicio` conserva el nombre histórico de la columna y representa la FUM.
 */
export const createEmbarazoSchema = z
  .object(embarazoFields)
  .superRefine(validatePregnancyDates);

export class CreateEmbarazoDto extends createZodDto(createEmbarazoSchema) {}

export const updateEmbarazoSchema = z
  .object(embarazoFields)
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "debes enviar al menos un campo",
  })
  .superRefine(validatePregnancyDates);

export class UpdateEmbarazoDto extends createZodDto(updateEmbarazoSchema) {}
