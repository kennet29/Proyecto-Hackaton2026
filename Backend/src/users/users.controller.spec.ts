/**
 * @file Backend/src/users/users.controller.spec.ts
 * @description TypeScript module implementation.
 */

import { UsersController } from "./users.controller";

describe("UsersController", () => {
  const buildController = () => {
    const usersService = {
      create: jest.fn(),
      getRegistrationStatus: jest.fn(),
      registerPublicUser: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    return {
      usersService,
      controller: new UsersController(usersService as never),
    };
  };

  it("creates users through the service", () => {
    const { controller, usersService } = buildController();
    const payload = { username: "admin", password: "secret", role: "admin" };
    const user = { id: 1, username: "admin" };
    usersService.create.mockResolvedValue(user);

    expect(controller.create(payload as never)).resolves.toBe(user);
    expect(usersService.create).toHaveBeenCalledWith(payload);
  });

  it("gets public registration status", () => {
    const { controller, usersService } = buildController();
    const result = { enabled: true };
    usersService.getRegistrationStatus.mockReturnValue(result);

    expect(controller.getRegistrationStatus()).toBe(result);
  });

  it("registers public users through the service", () => {
    const { controller, usersService } = buildController();
    const payload = { username: "new", password: "secret" };
    const result = { id: 2 };
    usersService.registerPublicUser.mockReturnValue(result);

    expect(controller.register(payload as never)).toBe(result);
    expect(usersService.registerPublicUser).toHaveBeenCalledWith(payload);
  });

  it("finds and updates users through the service", async () => {
    const { controller, usersService } = buildController();
    usersService.findAll.mockResolvedValue([{ id: 1 }]);
    usersService.findOne.mockResolvedValue({ id: 2 });
    usersService.update.mockResolvedValue({ id: 2, username: "changed" });

    await expect(controller.findAll()).resolves.toEqual([{ id: 1 }]);
    await expect(controller.findOne(2)).resolves.toEqual({ id: 2 });
    await expect(controller.update(2, { username: "changed" })).resolves.toEqual(
      { id: 2, username: "changed" },
    );
  });

  it("returns deleted true after removing a user", async () => {
    const { controller, usersService } = buildController();
    usersService.remove.mockResolvedValue(undefined);

    await expect(controller.remove(5)).resolves.toEqual({ deleted: true });
    expect(usersService.remove).toHaveBeenCalledWith(5);
  });
});
