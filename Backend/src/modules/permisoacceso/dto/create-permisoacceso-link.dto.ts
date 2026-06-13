import { createZodDto } from "nestjs-zod";
import { z } from "zod";

/**
 * Secciones permitidas para compartir por enlace.
 */
export const shareableSections = [
  "resumenClinico",
  "consultasMedicas",
  "saludMental",
  "periodo",
  "seguimientoFisico",
  "seguimientoPostevento",
  "examenesClinicos",
  "citasMedicas",
  "medicaciones",
  "vacunas",
  "alergias",
  "condicionesCronicas",
  "antecedentesFamiliares",
  "documentosClinicos",
  "desparasitaciones",
  "embarazos",
  "estiloVida",
  "evaluacionesHabitos",
  "habitosEspecificos",
  "lesiones",
  "notificaciones",
  "operaciones",
  "puntajesRiesgo",
  "recordatoriosCitas",
  "registroDental",
  "registrosMenstruales",
] as const;

/**
 * Secciones por defecto para el enlace compartido.
 */
export const defaultShareSections = [
  "resumenClinico",
  "consultasMedicas",
  "saludMental",
  "examenesClinicos",
] as const;

const shareSectionSchema = z.enum(shareableSections);

/**
 * Esquema Zod para validar la creaciÃ³n de enlaces compartidos.
 */
export const createPermisoAccesoLinkSchema = z.object({
  duracionMinutos: z.number().int().min(1).max(1440).default(60),
  secciones: z
    .array(shareSectionSchema)
    .min(1)
    .max(shareableSections.length)
    .default([...defaultShareSections])
    .transform((values) => Array.from(new Set(values))),
});

/**
 * DTO de entrada para crear un enlace compartido.
 */
export class CreatePermisoAccesoLinkDto extends createZodDto(
  createPermisoAccesoLinkSchema,
) {}
