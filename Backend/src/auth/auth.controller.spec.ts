/**
 * @file Backend/src/auth/auth.controller.spec.ts
 * @description TypeScript module implementation.
 */

import { AuthController } from "./auth.controller";

describe("AuthController", () => {
  const buildController = () => {
    const authService = {
      login: jest.fn(),
      requestPasswordReset: jest.fn(),
      resetPassword: jest.fn(),
      logout: jest.fn(),
    };
    return {
      authService,
      controller: new AuthController(authService as never),
    };
  };

  it("delegates login to AuthService", () => {
    const { controller, authService } = buildController();
    const payload = { username: "user", password: "secret" };
    const result = { accessToken: "token" };
    authService.login.mockReturnValue(result);

    expect(controller.login(payload)).toBe(result);
    expect(authService.login).toHaveBeenCalledWith(payload);
  });

  it("delegates password reset request to AuthService", () => {
    const { controller, authService } = buildController();
    const payload = { username: "user@example.com" };
    const result = { message: "ok" };
    authService.requestPasswordReset.mockReturnValue(result);

    expect(controller.requestReset(payload)).toBe(result);
    expect(authService.requestPasswordReset).toHaveBeenCalledWith(payload);
  });

  it("delegates password reset to AuthService", () => {
    const { controller, authService } = buildController();
    const payload = { token: "abc", password: "new-secret" };
    const result = { message: "contrasena actualizada" };
    authService.resetPassword.mockReturnValue(result);

    expect(controller.resetPassword(payload)).toBe(result);
    expect(authService.resetPassword).toHaveBeenCalledWith(payload);
  });

  it("delegates logout using the authenticated request user", () => {
    const { controller, authService } = buildController();
    const user = { userId: 1, username: "user", tokenId: "token-id" };
    const result = { message: "sesion cerrada" };
    authService.logout.mockReturnValue(result);

    expect(controller.logout({ user } as never)).toBe(result);
    expect(authService.logout).toHaveBeenCalledWith(user);
  });
});
