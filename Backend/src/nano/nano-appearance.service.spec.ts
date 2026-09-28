/**
 * @file Backend/src/nano/nano-appearance.service.spec.ts
 * @description TypeScript module implementation.
 */

import { NanoAppearanceService } from "./nano-appearance.service";
import { nanoAppearanceIds } from "./dto/select-nano-appearance.dto";

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
    return {
      rows,
      repository,
      service: new NanoAppearanceService(repository as never),
    };
  };

  it("unlocks every appearance when the user logs in", async () => {
    const { rows, service } = buildService();

    await service.registerLoginUnlocks(
      7,
      new Date("2026-02-14T12:00:00.000Z"),
    );

    expect(rows.map((row) => row.appearanceId)).toEqual(
      expect.arrayContaining([...nanoAppearanceIds]),
    );
  });

  it("returns every appearance for existing accounts", async () => {
    const { service } = buildService();

    await service.registerLoginUnlocks(
      9,
      new Date("2026-07-23T12:00:00.000Z"),
    );

    await expect(service.getState(9)).resolves.toEqual({
      selectedId: "base",
      unlockedIds: [...nanoAppearanceIds],
    });
  });
});
