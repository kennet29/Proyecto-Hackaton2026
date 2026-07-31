import { PacienteController } from "./paciente.controller";

describe("PacienteController", () => {
  const user = { userId: 1, username: "doctor", role: "doctor" };

  const buildController = () => {
    const pacienteService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      getClinicalSummary: jest.fn(),
    };
    const pacienteAccessService = {
      assertAccess: jest.fn(),
    };
    return {
      pacienteService,
      pacienteAccessService,
      controller: new PacienteController(
        pacienteService as never,
        pacienteAccessService as never,
      ),
    };
  };

  it("creates and lists patients through the service", () => {
    const { controller, pacienteService } = buildController();
    const payload = { nombre: "Ana" };
    pacienteService.create.mockReturnValue({ pacienteId: 1 });
    pacienteService.findAll.mockReturnValue([{ pacienteId: 1 }]);

    expect(controller.create(payload as never, { user } as never)).toEqual({
      pacienteId: 1,
    });
    expect(controller.findAll()).toEqual([{ pacienteId: 1 }]);
    expect(pacienteService.create).toHaveBeenCalledWith({
      ...payload,
      creadopor: user.username,
    });
  });

  it("checks access before returning a patient", async () => {
    const { controller, pacienteService, pacienteAccessService } =
      buildController();
    pacienteService.findOne.mockResolvedValue({ pacienteId: 10, nombre: "Ana" });

    await expect(
      controller.findOne("10", { user } as never),
    ).resolves.toMatchObject({ pacienteId: 10 });
    expect(pacienteAccessService.assertAccess).toHaveBeenCalledWith(user, 10);
  });

  it("checks access before clinical summary", async () => {
    const { controller, pacienteService, pacienteAccessService } =
      buildController();
    pacienteService.getClinicalSummary.mockResolvedValue({ pacienteId: 10 });

    await expect(
      controller.getClinicalSummary("10", { user } as never),
    ).resolves.toEqual({ pacienteId: 10 });
    expect(pacienteAccessService.assertAccess).toHaveBeenCalledWith(user, 10);
    expect(pacienteService.getClinicalSummary).toHaveBeenCalledWith(10);
  });

  it("checks access before update and remove", async () => {
    const { controller, pacienteService, pacienteAccessService } =
      buildController();
    pacienteService.findOne.mockResolvedValue({ pacienteId: 10 });
    pacienteService.update.mockResolvedValue({ pacienteId: 10, nombre: "Ana" });
    pacienteService.remove.mockResolvedValue({ deleted: true });

    await expect(
      controller.update("10", { nombre: "Ana" } as never, { user } as never),
    ).resolves.toEqual({ pacienteId: 10, nombre: "Ana" });
    await expect(controller.remove("10", { user } as never)).resolves.toEqual({
      deleted: true,
    });
    expect(pacienteAccessService.assertAccess).toHaveBeenCalledTimes(2);
  });
});
