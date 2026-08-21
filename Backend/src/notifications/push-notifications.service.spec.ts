import { PushNotificationsService } from "./push-notifications.service";

describe("PushNotificationsService", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("sends a due patient reminder through Expo Push", async () => {
    const devices = {
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          { id: 4, expoPushToken: "ExponentPushToken[valid-token]" },
        ]),
      })),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };
    const notifications = { createQueryBuilder: jest.fn() };
    const userPatients = {
      find: jest.fn().mockResolvedValue([{ usuarioId: 7 }]),
    };
    const users = { find: jest.fn().mockResolvedValue([]) };
    const config = { get: jest.fn(() => "true") };
    const service = new PushNotificationsService(
      devices as never,
      notifications as never,
      userPatients as never,
      users as never,
      config as never,
    );
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ status: "ok" }] }),
    }) as never;

    await expect(
      (service as any).sendForPatient({
        notificacionId: 12,
        pacienteId: 3,
        mensaje: "Tomar medicina",
      }),
    ).resolves.toBe(true);

    expect(global.fetch).toHaveBeenCalledWith(
      "https://exp.host/--/api/v2/push/send",
      expect.objectContaining({ method: "POST" }),
    );
    const request = (global.fetch as jest.Mock).mock.calls[0][1];
    expect(JSON.parse(request.body)).toEqual([
      expect.objectContaining({
        to: "ExponentPushToken[valid-token]",
        body: "Tomar medicina",
        channelId: "recordatorios-locales",
      }),
    ]);
  });
});
