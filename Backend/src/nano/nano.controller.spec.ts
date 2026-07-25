import { NanoController } from "./nano.controller";

describe("NanoController", () => {
  it("delegates meal analysis to NanoService", () => {
    const nanoService = {
      analyzeMeal: jest.fn().mockReturnValue({ score: 80 }),
    };
    const nanoAppearanceService = {
      getState: jest.fn(),
      select: jest.fn(),
    };
    const controller = new NanoController(
      nanoService as never,
      nanoAppearanceService as never,
    );
    const payload = { imageBase64: "abcd" };

    expect(controller.analyzeMeal(payload as never)).toEqual({ score: 80 });
    expect(nanoService.analyzeMeal).toHaveBeenCalledWith(payload);
  });

  it("returns the authenticated user's appearance state", () => {
    const nanoService = { analyzeMeal: jest.fn() };
    const nanoAppearanceService = {
      getState: jest.fn().mockReturnValue({
        selectedId: "base",
        unlockedIds: ["base"],
      }),
      select: jest.fn(),
    };
    const controller = new NanoController(
      nanoService as never,
      nanoAppearanceService as never,
    );

    expect(
      controller.getAppearance({ user: { userId: 8 } } as never),
    ).toEqual({ selectedId: "base", unlockedIds: ["base"] });
    expect(nanoAppearanceService.getState).toHaveBeenCalledWith(8);
  });
});
