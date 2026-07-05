import { BadRequestException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { getDataSourceToken } from "@nestjs/typeorm";
import { DatabaseController } from "./database.controller";
import { DatabaseService } from "./database.service";

describe("Database integration", () => {
  const buildModule = async () => {
    const dataSource = {
      query: jest.fn(),
    };
    const moduleRef = await Test.createTestingModule({
      controllers: [DatabaseController],
      providers: [
        DatabaseService,
        {
          provide: getDataSourceToken(),
          useValue: dataSource,
        },
      ],
    }).compile();

    return {
      dataSource,
      controller: moduleRef.get(DatabaseController),
    };
  };

  it("lists allowed tables through controller and service", async () => {
    const { controller } = await buildModule();

    expect(controller.listTables()).toContain("paciente");
    expect(controller.listTables()).toContain("usuario");
  });

  it("runs a read query through the real DatabaseService", async () => {
    const { controller, dataSource } = await buildModule();
    dataSource.query.mockResolvedValue([{ pacienteId: 1, nombre: "Ana" }]);

    await expect(controller.findAll("paciente")).resolves.toEqual([
      { pacienteId: 1, nombre: "Ana" },
    ]);
    expect(dataSource.query).toHaveBeenCalledWith("select * from [dbo].[paciente]");
  });

  it("rejects tables outside the allowlist before querying", async () => {
    const { controller, dataSource } = await buildModule();

    await expect(controller.findAll("tabla_invalida")).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(dataSource.query).not.toHaveBeenCalled();
  });
});
