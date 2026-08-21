import { Test } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";
import { NotificacionService } from "../modules/notificacion/notificacion.service";
import { PushNotificationsService } from "./push-notifications.service";

describe("Notifications integration", () => {
  const buildModule = async () => {
    const notificacionService = {
      create: jest.fn(),
    };
    const configService = {
      get: jest.fn((key: string) =>
        key === "NOTIFICATIONS_DEFAULT_TZ" ? "UTC" : undefined,
      ),
    };
    const pushNotificationsService = { registerDevice: jest.fn() };
    const moduleRef = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        NotificationsService,
        { provide: NotificacionService, useValue: notificacionService },
        { provide: ConfigService, useValue: configService },
        { provide: PushNotificationsService, useValue: pushNotificationsService },
      ],
    }).compile();

    return {
      notificacionService,
      pushNotificationsService,
      controller: moduleRef.get(NotificationsController),
    };
  };

  it("previews natural language schedules through the real service", async () => {
    const { controller } = await buildModule();

    expect(
      controller.previewSchedule({
        scheduleText: "tomorrow at 8am",
        referenceDate: new Date("2026-07-05T12:00:00.000Z"),
      }),
    ).toMatchObject({
      scheduleText: "tomorrow at 8am",
      timezone: "UTC",
      fechaprogramada: expect.any(String),
    });
  });

  it("registers a device for the authenticated user", async () => {
    const { controller, pushNotificationsService } = await buildModule();
    pushNotificationsService.registerDevice.mockResolvedValue({ id: 1, registered: true });

    await expect(
      controller.registerDevice(
        { expoPushToken: "ExponentPushToken[test]", platform: "android" },
        { user: { userId: 9 } } as never,
      ),
    ).resolves.toEqual({ id: 1, registered: true });
    expect(pushNotificationsService.registerDevice).toHaveBeenCalledWith(
      9,
      "ExponentPushToken[test]",
      "android",
    );
  });

  it("creates a notification with parsed schedule data", async () => {
    const { controller, notificacionService } = await buildModule();
    notificacionService.create.mockResolvedValue({ notificacionId: 1 });

    await expect(
      controller.scheduleFromNaturalLanguage({
        usuarioId: 1,
        titulo: "Medicina",
        mensaje: "Tomar pastilla",
        scheduleText: "tomorrow at 8am",
        referenceDate: new Date("2026-07-05T12:00:00.000Z"),
      } as never),
    ).resolves.toEqual({ notificacionId: 1 });
    expect(notificacionService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        usuarioId: 1,
        titulo: "Medicina",
        mensaje: "Tomar pastilla",
        campoprueba01: "tomorrow at 8am",
        campoprueba02: "UTC",
        fechaprogramada: expect.any(Date),
      }),
    );
  });
});
