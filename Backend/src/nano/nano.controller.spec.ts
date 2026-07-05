import { NanoController } from "./nano.controller";

describe("NanoController", () => {
  it("delegates meal analysis to NanoService", () => {
    const nanoService = {
      analyzeMeal: jest.fn().mockReturnValue({ score: 80 }),
    };
    const controller = new NanoController(nanoService as never);
    const payload = { imageBase64: "abcd" };

    expect(controller.analyzeMeal(payload as never)).toEqual({ score: 80 });
    expect(nanoService.analyzeMeal).toHaveBeenCalledWith(payload);
  });
});
