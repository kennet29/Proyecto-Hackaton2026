/**
 * @file Backend/src/auth/utils/security-config.util.ts
 * @description TypeScript module implementation.
 */

import { ConfigService } from "@nestjs/config";

const MINIMUM_SECRET_LENGTH = 32;

export function getRequiredJwtSecret(config: ConfigService): string {
  const secret = config.get<string>("JWT_SECRET")?.trim();
  if (!secret || secret === "dev-secret" || secret.length < MINIMUM_SECRET_LENGTH) {
    throw new Error(`JWT_SECRET debe estar definido y tener al menos ${MINIMUM_SECRET_LENGTH} caracteres`);
  }
  return secret;
}
