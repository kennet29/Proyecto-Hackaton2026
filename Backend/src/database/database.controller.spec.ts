import { DatabaseController } from "./database.controller";

describe("DatabaseController", () => {
  const buildController = () => {
    const databaseService = {
      listTables: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    return {
      databaseService,
      controller: new DatabaseController(databaseService as never),
    };
  };

  it("lists tables", () => {
    const { controller, databaseService } = buildController();
    databaseService.listTables.mockReturnValue(["Usuario"]);

    expect(controller.listTables()).toEqual(["Usuario"]);
  });

  it("delegates read operations to DatabaseService", async () => {
    const { controller, databaseService } = buildController();
    databaseService.findAll.mockResolvedValue([{ id: 1 }]);
    databaseService.findOne.mockResolvedValue({ id: 1 });

    await expect(controller.findAll("Usuario")).resolves.toEqual([{ id: 1 }]);
    await expect(controller.findOne("Usuario", "1")).resolves.toEqual({ id: 1 });
  });

  it("delegates write operations to DatabaseService", async () => {
    const { controller, databaseService } = buildController();
    databaseService.create.mockResolvedValue({ id: 1 });
    databaseService.update.mockResolvedValue({ id: 1, nombre: "Ana" });
    databaseService.remove.mockResolvedValue(undefined);

    await expect(controller.create("Usuario", { nombre: "Ana" })).resolves.toEqual(
      { id: 1 },
    );
    await expect(
      controller.update("Usuario", "1", { nombre: "Ana" }),
    ).resolves.toEqual({ id: 1, nombre: "Ana" });
    await expect(controller.remove("Usuario", "1")).resolves.toBeUndefined();
  });
});
