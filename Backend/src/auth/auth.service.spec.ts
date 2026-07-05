import { Logger, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { AuthService, type AuthenticatedUser } from "./auth.service";

describe("AuthService", () => {
  const buildService = () => {
    const usersService = {
      findByUsername: jest.fn(),
      registerLogin: jest.fn(),
      update: jest.fn(),
    };
    const jwtService = {
      signAsync: jest.fn().mockResolvedValue("signed-token"),
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

    const service = new AuthService(
      usersService as never,
      jwtService as never,
      resetRepository as never,
      usuarioPacienteRepository as never,
      mailService as never,
      tokenRevocationService as never,
    );

    return {
      service,
      usersService,
      jwtService,
      resetRepository,
      usuarioPacienteRepository,
      mailService,
      tokenRevocationService,
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
    const { service, usersService, jwtService, usuarioPacienteRepository } =
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
});
