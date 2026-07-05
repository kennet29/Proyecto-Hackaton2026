import { Test } from "@nestjs/testing";
import { DataSource } from "typeorm";
import { VersionModule } from "../version/version.module";
import { HealthController } from "./health.controller";

describe("Health integration", () => {
  it("wires HealthController with VersionService and DataSource", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [VersionModule],
      controllers: [HealthController],
      providers: [
        {
          provide: DataSource,
          useValue: {
            isInitialized: true,
            options: { database: "GestionSalud" },
          },
        },
      ],
    }).compile();

    const controller = moduleRef.get(HealthController);

    expect(controller.getHealth()).toMatchObject({
      status: "ok",
      service: "backend",
      apiVersion: "v1",
      database: {
        status: "up",
        name: "GestionSalud",
      },
    });
  });
});
