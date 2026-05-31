import { z } from "zod";

/**
 * Lista de tablas habilitadas para la API genérica de base de datos.
 */
export const allowedTables = [
  "paciente",
  "usuario",
  "rol",
  "permiso",
  "rolpermiso",
  "usuariorol",
  "especialidad",
  "tipovacuna",
  "tipolesion",
  "tipooperacion",
  "tipodocumentoclinico",
  "tipocondicioncronica",
  "tipohabito",
  "consultamedica",
  "lesion",
  "estilovida",
  "vacuna",
  "citamedica",
  "registrodental",
  "operacion",
  "desparasitacion",
  "registromensual",
  "embarazo",
  "controlprenatal",
  "documentoclinico",
  "examenclinico",
  "notificacion",
  "recordatoriocita",
  "medicacion",
  "horariomedicamento",
  "alergia",
  "antecedentefamiliar",
  "habitoespecifico",
  "puntajeriesgo",
  "condicioncronica",
  "objetivocronico",
  "controlcronico",
  "adherenciacronica",
  "evaluacionsaludhabito",
  "detalleevaluacionsalud",
  "seguimientopostevento",
] as const;

/**
 * Define el tipo allowed table utilizado por el backend.
 */
export type AllowedTable = (typeof allowedTables)[number];

/**
 * Esquema Zod utilizado por table name.
 */
export const tableNameSchema = z.enum(allowedTables);

/**
 * Define el tipo json value utilizado por el backend.
 */
type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(z.string(), jsonValueSchema),
  ]),
);

const basePayloadSchema = z
  .record(z.string(), jsonValueSchema)
  .refine((value) => Object.keys(value).length > 0, {
    message: "el cuerpo no puede estar vacio",
  });

/**
 * Esquema Zod para validar la creación de payload.
 */
export const createPayloadSchema = basePayloadSchema;
/**
 * Esquema Zod para validar la actualización de payload.
 */
export const updatePayloadSchema = basePayloadSchema;

/**
 * Esquema Zod utilizado por record id.
 */
export const recordIdSchema = z
  .string()
  .trim()
  .min(1, "el id no puede estar vacio");
