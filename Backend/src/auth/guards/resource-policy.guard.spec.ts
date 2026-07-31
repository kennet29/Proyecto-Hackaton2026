import { ForbiddenException } from "@nestjs/common";
import { ResourcePolicyGuard } from "./resource-policy.guard";

describe("ResourcePolicyGuard", () => {
  const guard = new ResourcePolicyGuard();
  const context = (
    controllerName: string,
    method: string,
    role: string,
  ) =>
    ({
      getType: () => "http",
      getClass: () => ({ name: controllerName }),
      switchToHttp: () => ({
        getRequest: () => ({
          method,
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

  it("allows administrators to manage protected resources", () => {
    expect(
      guard.canActivate(context("RolController", "DELETE", "admin")),
    ).toBe(true);
  });
});
