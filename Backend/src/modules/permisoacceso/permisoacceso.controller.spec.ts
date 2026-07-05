import { PermisoaccesoController } from "./permisoacceso.controller";

describe("PermisoaccesoController", () => {
  const user = { userId: 1, username: "doctor", role: "doctor" };

  const buildController = () => {
    const permisosService = {
      grant: jest.fn(),
      listForPaciente: jest.fn(),
      listForMedico: jest.fn(),
      revoke: jest.fn(),
      update: jest.fn(),
      createQrToken: jest.fn(),
      createShareLink: jest.fn(),
      resolveShareLink: jest.fn(),
      claimQrToken: jest.fn(),
    };
    return {
      permisosService,
      controller: new PermisoaccesoController(permisosService as never),
    };
  };

  it("grants and lists permissions using request user context", () => {
    const { controller, permisosService } = buildController();
    const payload = { medicoUsuarioId: 7 };
    permisosService.grant.mockReturnValue({ permisoId: 1 });
    permisosService.listForPaciente.mockReturnValue([{ permisoId: 1 }]);
    permisosService.listForMedico.mockReturnValue([{ permisoId: 2 }]);

    expect(controller.create(10, payload as never, { user } as never)).toEqual({
      permisoId: 1,
    });
    expect(controller.findForPaciente(10, { user } as never)).toEqual([
      { permisoId: 1 },
    ]);
    expect(controller.findForMedico({ user } as never)).toEqual([
      { permisoId: 2 },
    ]);
    expect(permisosService.grant).toHaveBeenCalledWith(10, payload, user);
  });

  it("updates and revokes permissions using request user context", () => {
    const { controller, permisosService } = buildController();
    const payload = { estado: "revocado" };
    permisosService.update.mockReturnValue({ permisoId: 5 });
    permisosService.revoke.mockReturnValue({ deleted: true });

    expect(controller.update(5, payload as never, { user } as never)).toEqual({
      permisoId: 5,
    });
    expect(controller.revoke(5, { user } as never)).toEqual({ deleted: true });
    expect(permisosService.update).toHaveBeenCalledWith(5, payload, user);
    expect(permisosService.revoke).toHaveBeenCalledWith(5, user);
  });

  it("creates QR tokens and share links", () => {
    const { controller, permisosService } = buildController();
    const qrPayload = { expiresInMinutes: 15 };
    const linkPayload = { expiresInMinutes: 30 };
    permisosService.createQrToken.mockReturnValue({ token: "qr" });
    permisosService.createShareLink.mockReturnValue({ url: "https://x" });

    expect(controller.generateQr(3, qrPayload as never, { user } as never)).toEqual(
      { token: "qr" },
    );
    expect(
      controller.generateShareLink(3, linkPayload as never, { user } as never),
    ).toEqual({ url: "https://x" });
  });

  it("resolves public share links and claims QR tokens", () => {
    const { controller, permisosService } = buildController();
    const payload = { token: "qr-token" };
    permisosService.resolveShareLink.mockReturnValue({ pacienteId: 10 });
    permisosService.claimQrToken.mockReturnValue({ permisoId: 8 });

    expect(controller.resolveShareLink("share-token")).toEqual({
      pacienteId: 10,
    });
    expect(controller.claimQr(payload as never, { user } as never)).toEqual({
      permisoId: 8,
    });
  });
});
