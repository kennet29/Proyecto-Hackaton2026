import { ForbiddenException } from "@nestjs/common";
import { UsuarioPacienteService } from "./usuariopaciente.service";

describe("UsuarioPacienteService", () => {
  const actor = {
    userId: 5,
    username: "ana@example.com",
    role: "paciente",
  };

  const buildService = (creadopor: string) => {
    const usuarioPacienteRepository = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => ({ id: 1, ...value })),
    };
    const permisoRepository = { find: jest.fn() };
    const pacienteRepository = {
      findOne: jest.fn().mockResolvedValue({ pacienteId: 9, creadopor }),
    };
    return {
      usuarioPacienteRepository,
      service: new UsuarioPacienteService(
        usuarioPacienteRepository as never,
        permisoRepository as never,
        pacienteRepository as never,
      ),
    };
  };

  it("rejects linking a patient created by another account", async () => {
    const { service } = buildService("otro@example.com");

    await expect(
      service.link(actor, { pacienteId: 9 } as never),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("allows linking a patient just created by the same account", async () => {
    const { service, usuarioPacienteRepository } = buildService(
      "ANA@example.com",
    );

    await expect(
      service.link(actor, { pacienteId: 9 } as never),
    ).resolves.toMatchObject({ usuarioId: 5, pacienteId: 9 });
    expect(usuarioPacienteRepository.save).toHaveBeenCalled();
  });
});
