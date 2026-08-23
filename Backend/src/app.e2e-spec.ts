/**
 * @file Backend/src/app.e2e-spec.ts
 * @description TypeScript module implementation.
 */

import { BadRequestException, INestApplication, VersioningType } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { DataSource } from "typeorm";
import { ApiExceptionFilter } from "./common/filters/api-exception.filter";
import { AuthController } from "./auth/auth.controller";
import { AuthService } from "./auth/auth.service";
import { HealthController } from "./health/health.controller";
import { UsersController } from "./users/users.controller";
import { UsersService } from "./users/users.service";
import { VersionController } from "./version/version.controller";
import { VersionService } from "./version/version.service";

describe("Backend API e2e", () => {
  let app: INestApplication;
  const authService = {
    login: jest.fn(),
    requestPasswordReset: jest.fn(),
    resetPassword: jest.fn(),
    logout: jest.fn(),
  };
  const usersService = {
    getRegistrationStatus: jest.fn(),
    registerPublicUser: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    authService.login.mockResolvedValue({
      accessToken: "signed-token",
      user: { id: 1, username: "doctor@example.com", role: "doctor" },
    });
    usersService.getRegistrationStatus.mockReturnValue({ enabled: true });

    const moduleRef = await Test.createTestingModule({
      controllers: [
        AuthController,
        HealthController,
        UsersController,
        VersionController,
      ],
      providers: [
        VersionService,
        { provide: AuthService, useValue: authService },
        { provide: UsersService, useValue: usersService },
        {
          provide: DataSource,
          useValue: {
            isInitialized: true,
            options: { database: "GestionSalud" },
          },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: "1",
    });
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it("GET /api/v1/health returns service health", async () => {
    await request(app.getHttpServer())
      .get("/api/v1/health")
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          status: "ok",
          service: "backend",
          apiVersion: "v1",
          database: {
            status: "up",
            name: "GestionSalud",
          },
        });
        expect(typeof body.timestamp).toBe("string");
      });
  });

  it("GET /api/v1/version returns backend version metadata", async () => {
    await request(app.getHttpServer())
      .get("/api/v1/version")
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          name: "backend",
          apiVersion: "v1",
          semver: expect.objectContaining({
            major: expect.any(Number),
            minor: expect.any(Number),
            patch: expect.any(Number),
          }),
        });
      });
  });

  it("POST /api/v1/auth/login returns access token", async () => {
    await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ username: "doctor@example.com", password: "secret" })
      .expect(201)
      .expect(({ body }) => {
        expect(body).toEqual({
          accessToken: "signed-token",
          user: { id: 1, username: "doctor@example.com", role: "doctor" },
        });
      });
    expect(authService.login).toHaveBeenCalledWith({
      username: "doctor@example.com",
      password: "secret",
    });
  });

  it("GET /api/v1/users/registration-status returns public registration status", async () => {
    await request(app.getHttpServer())
      .get("/api/v1/users/registration-status")
      .expect(200)
      .expect({ enabled: true });
  });

  it("formats thrown HTTP errors through ApiExceptionFilter", async () => {
    authService.login.mockRejectedValueOnce(
      new BadRequestException("payload invalido"),
    );

    await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ username: "doctor@example.com", password: "bad" })
      .expect(400)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          statusCode: 400,
          error: "BadRequestException",
          message: "payload invalido",
          path: "/api/v1/auth/login",
          hint: expect.any(String),
        });
        expect(typeof body.timestamp).toBe("string");
      });
  });
});
