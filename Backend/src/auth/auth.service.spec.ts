import { Logger, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { AuthService, type AuthenticatedUser } from "./auth.service";

describe("AuthService", () => {
  const buildService = () => {
    const usersService = {
      findByUsername: jest.fn(),
      findByUsernameOrEmail: jest.fn(),
      registerLogin: jest.fn(),
      update: jest.fn(),
    };
    const jwtService = {
      signAsync: jest.fn().mockResolvedValue("signed-token"),
      verifyAsync: jest.fn(),
    };
    const resetRepository = {
      update: jest.fn(),
      create: jest.fn((value) => value),
      save: jest.fn(),
      findOne: jest.fn(),
    };
    const usuarioPacienteRepository = {
      find: jest.fn().mockResolvedValue([]),
    };
    const mailService = {
      sendPasswordResetMail: jest.fn(),
    };
    const tokenRevocationService = {
      revoke: jest.fn(),
    };
    const nanoAppearanceService = {
      registerLoginUnlocks: jest.fn(),
    };

    const service = new AuthService(
      usersService as never,
      jwtService as never,
      resetRepository as never,
      usuarioPacienteRepository as never,
      mailService as never,
      tokenRevocationService as never,
      nanoAppearanceService as never,
    );

    return {
      service,
      usersService,
      jwtService,
      resetRepository,
      usuarioPacienteRepository,
      mailService,
      tokenRevocationService,
      nanoAppearanceService,
    };
  };

  beforeEach(() => {
    jest.spyOn(console, "log").mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("logs in with username and password", async () => {
    const {
      service,
      usersService,
      jwtService,
      usuarioPacienteRepository,
      nanoAppearanceService,
    } =
      buildService();
    usersService.findByUsername.mockResolvedValue({
      id: 7,
      username: "doctor@example.com",
      role: "doctor",
      hashPassword: Buffer.from(await bcrypt.hash("secret", 4), "utf8"),
      pacienteId: null,
    });
    usuarioPacienteRepository.find.mockResolvedValue([
      { pacienteId: 30, esPrincipal: false },
      { pacienteId: 12, esPrincipal: true },
    ]);

    const result = await service.login({
      username: "doctor@example.com",
      password: "secret",
    });

    expect(result.accessToken).toBe("signed-token");
    expect(result.user).toMatchObject({
      id: 7,
      username: "doctor@example.com",
      role: "doctor",
      pacienteId: 12,
      pacienteIds: [30, 12],
    });
    expect(usersService.registerLogin).toHaveBeenCalledWith(7);
    expect(nanoAppearanceService.registerLoginUnlocks).toHaveBeenCalledWith(7);
    expect(jwtService.signAsync).toHaveBeenCalledWith(
      expect.objectContaining({ sub: 7, pacienteId: 12 }),
      expect.objectContaining({ jwtid: expect.any(String) }),
    );
  });

  it("rejects invalid credentials", async () => {
    const { service, usersService } = buildService();
    usersService.findByUsername.mockResolvedValue(null);

    await expect(
      service.login({ username: "missing", password: "bad" }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("revokes the current token on logout", async () => {
    const { service, tokenRevocationService } = buildService();
    const user: AuthenticatedUser = {
      userId: 9,
      username: "user",
      tokenId: "token-id",
      exp: 1_900_000_000,
    };

    await expect(service.logout(user)).resolves.toEqual({
      message: "sesion cerrada",
    });
    expect(tokenRevocationService.revoke).toHaveBeenCalledWith(
      "token-id",
      9,
      new Date(1_900_000_000 * 1000),
    );
  });

  it("requires a token id to logout", async () => {
    const { service } = buildService();

    await expect(
      service.logout({ userId: 9, username: "user" }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("completes password recovery with captcha and security answer", async () => {
    const { service, usersService, jwtService, resetRepository } =
      buildService();
    jest.spyOn(service as any, "validateAltcha").mockResolvedValue(undefined);
    usersService.findByUsernameOrEmail.mockResolvedValue({
      id: 21,
      username: "ana@example.com",
      securityQuestion: "pet",
      securityAnswerHash: await bcrypt.hash("firulais", 4),
    });

    const requested = await service.requestPasswordReset({
      username: "ana@example.com",
      securityQuestion: "pet",
      securityAnswer: "Fírulais",
      altchaPayload: "valid-altcha-payload-value",
    });

    expect(requested.token).toMatch(/^[A-HJ-NP-Z2-9]{4}$/);
    expect(resetRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ usuarioId: 21, token: requested.token }),
    );

    const tokenRecord = {
      usuarioId: 21,
      token: requested.token,
      expiresAt: new Date(Date.now() + 60_000),
      used: false,
    };
    resetRepository.findOne.mockResolvedValue(tokenRecord);

    await expect(
      service.resetPassword({ token: requested.token, password: "NuevaClave123" }),
    ).resolves.toEqual({ message: "contrasena actualizada" });
    expect(usersService.update).toHaveBeenCalledWith(21, {
      password: "NuevaClave123",
    });
    expect(tokenRecord.used).toBe(true);
  });

  it("rejects password recovery when the security answer is wrong", async () => {
    const { service, usersService, jwtService, resetRepository } = buildService();
    jest.spyOn(service as any, "validateAltcha").mockResolvedValue(undefined);
    usersService.findByUsernameOrEmail.mockResolvedValue({
      id: 22,
      username: "luis@example.com",
      securityQuestion: "city",
      securityAnswerHash: await bcrypt.hash("managua", 4),
    });

    await expect(
      service.requestPasswordReset({
        username: "luis@example.com",
        securityQuestion: "city",
        securityAnswer: "Leon",
        altchaPayload: "valid-altcha-payload-value",
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(resetRepository.save).not.toHaveBeenCalled();
  });
});
