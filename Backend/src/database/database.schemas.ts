import { z } from 'zod';

export const allowedTables = [
  'paciente',
  'usuario',
  'rol',
  'permiso',
  'rolpermiso',
  'usuariorol',
  'especialidad',
  'tipovacuna',
  'tipolesion',
  'tipooperacion',
  'tipodocumentoclinico',
  'tipocondicioncronica',
  'tipohabito',
  'consultamedica',
  'lesion',
  'estilovida',
  'vacuna',
  'citamedica',
  'registrodental',
  'operacion',
  'desparasitacion',
  'registromensual',
  'embarazo',
  'controlprenatal',
  'documentoclinico',
  'examenclinico',
  'notificacion',
  'recordatoriocita',
  'medicacion',
  'horariomedicamento',
  'alergia',
  'antecedentefamiliar',
  'habitoespecifico',
  'puntajeriesgo',
  'condicioncronica',
  'objetivocronico',
  'controlcronico',
  'adherenciacronica',
  'evaluacionsaludhabito',
  'detalleevaluacionsalud',
] as const;

export type AllowedTable = (typeof allowedTables)[number];

export const tableNameSchema = z.enum(allowedTables);

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

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
    message: 'el cuerpo no puede estar vacio',
  });

export const createPayloadSchema = basePayloadSchema;
export const updatePayloadSchema = basePayloadSchema;

export const recordIdSchema = z.string().trim().min(1, 'el id no puede estar vacio');
