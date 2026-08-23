/**
 * @file Backend/src/nano/nano-appearance.service.spec.ts
 * @description TypeScript module implementation.
 */

import { BadRequestException } from "@nestjs/common";
import { NanoAppearanceService } from "./nano-appearance.service";

describe("NanoAppearanceService", () => {
  const buildService = () => {
    const rows: Array<Record<string, unknown>> = [];
    const repository = {
      findOne: jest.fn(({ where }) => {
        const row =
          rows.find(
            (item) =>
              item.usuarioId === where.usuarioId &&
              item.appearanceId === where.appearanceId,
          ) ?? null;
        return Promise.resolve(row);
      }),
      find: jest.fn().mockImplementation(({ where }) => {
        const userRows = rows.filter(
          (row) => row.usuarioId === where.usuarioId,
        );
        return Promise.resolve(userRows);
      }),
      create: jest.fn((value) => ({ ...value })),
      save: jest.fn((value) => {
        rows.push(value);
        return Promise.resolve(value);
      }),
      manager: { transaction: jest.fn() },
    };
    const config = {
      get: jest.fn().mockReturnValue("America/Managua"),
    };
    return {
      rows,
      repository,
      service: new NanoAppearanceService(repository as never, config as never),
    };
  };

  it("unlocks the dated appearance using Nicaragua time", async () => {
    const { rows, service } = buildService();

    await service.registerLoginUnlocks(
      7,
      new Date("2026-02-14T12:00:00.000Z"),
    );

    expect(rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ usuarioId: 7, appearanceId: "base" }),
        expect.objectContaining({ usuarioId: 7, appearanceId: "valentin" }),
      ]),
    );
  });

  it("keeps only Nano Base unlocked on an ordinary date", async () => {
    const { service } = buildService();

    await service.registerLoginUnlocks(
      9,
      new Date("2026-07-23T12:00:00.000Z"),
    );

    await expect(service.getState(9)).resolves.toEqual({
      selectedId: "base",
      unlockedIds: ["base"],
    });
  });

  it("rejects selecting an appearance that has not been unlocked", async () => {
    const { service } = buildService();

    await expect(service.select(4, "halloween")).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
