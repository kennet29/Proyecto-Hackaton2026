import { NotificationsController } from "./notifications.controller";

describe("NotificationsController", () => {
  const buildController = () => {
    const notificationsService = {
      scheduleFromNaturalLanguage: jest.fn(),
      previewSchedule: jest.fn(),
    };
    return {
      notificationsService,
      controller: new NotificationsController(notificationsService as never),
    };
  };

  it("schedules notifications from natural language", () => {
    const { controller, notificationsService } = buildController();
    const payload = { text: "mañana a las 8" };
    notificationsService.scheduleFromNaturalLanguage.mockReturnValue({
      scheduled: true,
    });

    expect(controller.scheduleFromNaturalLanguage(payload as never)).toEqual({
      scheduled: true,
    });
    expect(notificationsService.scheduleFromNaturalLanguage).toHaveBeenCalledWith(
      payload,
    );
  });

  it("previews parsed schedules", () => {
    const { controller, notificationsService } = buildController();
    const payload = { text: "mañana" };
    notificationsService.previewSchedule.mockReturnValue({ preview: true });

    expect(controller.previewSchedule(payload as never)).toEqual({
      preview: true,
    });
    expect(notificationsService.previewSchedule).toHaveBeenCalledWith(payload);
  });
});
