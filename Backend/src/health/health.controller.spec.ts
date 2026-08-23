/**
 * @file Backend/src/health/health.controller.spec.ts
 * @description TypeScript module implementation.
 */

import { HealthController } from "./health.controller";

describe("HealthController", () => {
  const versionService = {
    getBackendVersion: jest.fn().mockReturnValue({
      name: "backend",
      version: "1.2.3",
      apiVersion: "v1",
    }),
  };

  beforeEach(() => {
    versionService.getBackendVersion.mockClear();
  });

  it("reports ok when the database is initialized", () => {
    const dataSource = {
      isInitialized: true,
      options: { database: "GestionSalud" },
    };
    const controller = new HealthController(
      dataSource as never,
      versionService as never,
    );

    expect(controller.getHealth()).toMatchObject({
      status: "ok",
      service: "backend",
      version: "1.2.3",
      apiVersion: "v1",
      database: { status: "up", name: "GestionSalud" },
    });
  });

  it("reports degraded when the database is not initialized", () => {
    const dataSource = {
      isInitialized: false,
      options: { database: "GestionSalud" },
    };
    const controller = new HealthController(
      dataSource as never,
      versionService as never,
    );

    expect(controller.getHealth()).toMatchObject({
      status: "degraded",
      database: { status: "down", name: "GestionSalud" },
    });
  });
});
