import { z } from "zod";

/**
 * Esquema Zod utilizado por fingerprint template.
 */
export const fingerprintTemplateSchema = z
  .string({
    error: (issue) => {
      if (
        issue.code === "invalid_type" &&
        (issue.input === undefined || issue.input === null)
      ) {
        return "la huella digital es requerida";
      }
      if (issue.code === "invalid_type") {
        return "la huella digital debe ser una cadena";
      }
      return undefined;
    },
  })
  .min(40, "la huella digital es demasiado corta")
  .max(5000, "la huella digital es demasiado larga")
  .regex(
    /^[A-Za-z0-9+/=]+$/,
    "la huella digital debe estar codificada en base64",
  );
