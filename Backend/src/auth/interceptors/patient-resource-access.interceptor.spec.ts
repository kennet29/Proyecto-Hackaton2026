import { of, lastValueFrom } from "rxjs";
import { PatientResourceAccessInterceptor } from "./patient-resource-access.interceptor";

describe("PatientResourceAccessInterceptor", () => {
  const user = { userId: 1, username: "test", role: "paciente" };
  const buildContext = (request: Record<string, unknown>) =>
    ({
      getType: () => "http",
      getClass: () => ({ name: "PeriodoController" }),
      switchToHttp: () => ({ getRequest: () => ({ user, ...request }) }),
    }) as never;

  it("keeps a custom response intact after a patient-bound request was checked", async () => {
    const accessService = {
      isProtectedResource: jest.fn().mockReturnValue(true),
      assertRequestAccess: jest.fn().mockResolvedValue(undefined),
      protectResponse: jest.fn(),
    };
    const interceptor = new PatientResourceAccessInterceptor(
      accessService as never,
    );
    const response = [{ logro: "Meta alcanzada" }];

    const stream = await interceptor.intercept(
      buildContext({ method: "GET", params: { pacienteId: 1 } }),
      { handle: () => of(response) },
    );

    await expect(lastValueFrom(stream)).resolves.toEqual(response);
    expect(accessService.protectResponse).not.toHaveBeenCalled();
  });

  it("filters an unscoped clinical collection before returning it", async () => {
    const accessService = {
      isProtectedResource: jest.fn().mockReturnValue(true),
      assertRequestAccess: jest.fn().mockResolvedValue(undefined),
      protectResponse: jest.fn().mockResolvedValue([{ pacienteId: 1 }]),
    };
    const interceptor = new PatientResourceAccessInterceptor(
      accessService as never,
    );

    const stream = await interceptor.intercept(
      buildContext({ method: "GET", params: {}, query: {} }),
      { handle: () => of([{ pacienteId: 1 }, { pacienteId: 2 }]) },
    );

    await expect(lastValueFrom(stream)).resolves.toEqual([{ pacienteId: 1 }]);
    expect(accessService.protectResponse).toHaveBeenCalled();
  });
});
