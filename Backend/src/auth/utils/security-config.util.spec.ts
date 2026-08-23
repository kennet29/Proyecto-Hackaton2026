/**
 * @file Backend/src/auth/utils/security-config.util.spec.ts
 * @description TypeScript module implementation.
 */

import { getRequiredJwtSecret } from "./security-config.util";

describe("getRequiredJwtSecret", () => {
  it("rejects missing, default, and short secrets", () => {
    expect(() => getRequiredJwtSecret({ get: () => undefined } as never)).toThrow("JWT_SECRET");
    expect(() => getRequiredJwtSecret({ get: () => "dev-secret" } as never)).toThrow("JWT_SECRET");
    expect(() => getRequiredJwtSecret({ get: () => "short-secret" } as never)).toThrow("JWT_SECRET");
  });

  it("returns a configured strong secret", () => {
    const secret = "a-strong-jwt-secret-with-more-than-32-characters";
    expect(getRequiredJwtSecret({ get: () => secret } as never)).toBe(secret);
  });
});
