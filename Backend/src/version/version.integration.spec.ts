import { Test } from "@nestjs/testing";
import { VersionController } from "./version.controller";
import { VersionModule } from "./version.module";
import { VersionService } from "./version.service";

describe("VersionModule integration", () => {
  it("wires VersionController with VersionService", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [VersionModule],
    }).compile();

    const controller = moduleRef.get(VersionController);
    const service = moduleRef.get(VersionService);

    expect(controller.getVersion()).toEqual(service.getBackendVersion());
    expect(controller.getVersion()).toMatchObject({
      name: "backend",
      apiVersion: "v1",
    });
  });
});
