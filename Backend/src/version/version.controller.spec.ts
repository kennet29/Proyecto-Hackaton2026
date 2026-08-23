/**
 * @file Backend/src/version/version.controller.spec.ts
 * @description TypeScript module implementation.
 */

import { VersionController } from "./version.controller";

describe("VersionController", () => {
  it("returns backend version from the service", () => {
    const version = {
      name: "backend",
      description: "api",
      version: "1.2.3",
      semver: { major: 1, minor: 2, patch: 3, prerelease: null },
      apiVersion: "v1",
      buildDate: "2026-07-05T00:00:00.000Z",
    };
    const service = { getBackendVersion: jest.fn().mockReturnValue(version) };
    const controller = new VersionController(service as never);

    expect(controller.getVersion()).toBe(version);
    expect(service.getBackendVersion).toHaveBeenCalledTimes(1);
  });
});
