/**
 * @file Backend/src/auth/guards/resource-policy.guard.spec.ts
 * @description TypeScript module implementation.
 */

import { ForbiddenException } from "@nestjs/common";
import { ResourcePolicyGuard } from "./resource-policy.guard";

describe("ResourcePolicyGuard", () => {
  const guard = new ResourcePolicyGuard();
  const context = (
    controllerName: string,
    method: string,
    role: string,
    body: Record<string, unknown> = {},
    path = "",
  ) =>
    ({
      getType: () => "http",
      getClass: () => ({ name: controllerName }),
      switchToHttp: () => ({
        getRequest: () => ({
          method,
          body,
          path,
          user: { userId: 1, username: "test", role },
        }),
      }),
    }) as never;

  it("blocks regular users from administrative controllers", () => {
    expect(() =>
      guard.canActivate(context("UsuarioController", "GET", "paciente")),
    ).toThrow(ForbiddenException);
  });

  it("allows authenticated users to read catalogs", () => {
    expect(
      guard.canActivate(
        context("TipovacunaController", "GET", "paciente"),
      ),
    ).toBe(true);
  });

  it("blocks regular users from changing catalogs", () => {
    expect(() =>
      guard.canActivate(
        context("TipovacunaController", "PATCH", "medico"),
      ),
    ).toThrow(ForbiddenException);
  });

  it("allows users to create the controlled healthy-habit type", () => {
    expect(
      guard.canActivate(
        context("TipohabitoController", "POST", "paciente", {
          nombre: "Hábito saludable personalizado",
          categoria: "bienestar",
        }),
      ),
    ).toBe(true);
  });

  it("keeps other habit-type mutations restricted to administrators", () => {
    expect(() =>
      guard.canActivate(
        context("TipohabitoController", "POST", "paciente", {
          nombre: "Tipo no autorizado",
          categoria: "bienestar",
        }),
      ),
    ).toThrow(ForbiddenException);
  });

  it("allows users to create a condition through the controlled route", () => {
    expect(
      guard.canActivate(
        context(
          "TipocondicioncronicaController",
          "POST",
          "paciente",
          { nombre: "Hipertensión" },
          "/api/v1/tipocondicioncronica/user-defined",
        ),
      ),
    ).toBe(true);
  });

  it("keeps direct condition catalog creation restricted", () => {
    expect(() =>
      guard.canActivate(
        context("TipocondicioncronicaController", "POST", "paciente", {
          nombre: "Tipo no autorizado",
        }),
      ),
    ).toThrow(ForbiddenException);
  });

  it("allows administrators to manage protected resources", () => {
    expect(
      guard.canActivate(context("RolController", "DELETE", "admin")),
    ).toBe(true);
  });
});
