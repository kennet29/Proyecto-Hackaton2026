/**
 * @file Backend/src/common/idempotency/idempotency.interceptor.spec.ts
 * @description TypeScript module implementation.
 */

import { CallHandler, ExecutionContext } from "@nestjs/common";
import { firstValueFrom, of } from "rxjs";
import { IdempotencyInterceptor } from "./idempotency.interceptor";

const createContext = (
  operationId: string,
  body: Record<string, unknown> = { value: 1 },
) => {
  const headers: Record<string, string> = {};
  const request = {
    method: "POST",
    originalUrl: "/api/v1/alergia",
    body,
    user: { userId: 7 },
    header: (name: string) =>
      name === "Idempotency-Key" ? operationId : undefined,
  };
  const response = {
    setHeader: jest.fn((name: string, value: string) => {
      headers[name] = value;
    }),
  };
  const context = {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as unknown as ExecutionContext;
  return { context, response, headers };
};

describe("IdempotencyInterceptor", () => {
  it("reutiliza el resultado para la misma operacion", async () => {
    const interceptor = new IdempotencyInterceptor();
    const first = createContext("offline-operation-123");
    const repeated = createContext("offline-operation-123");
    const handler: CallHandler = {
      handle: jest.fn(() => of({ id: 10 })),
    };

    const firstResult = await firstValueFrom(
      interceptor.intercept(first.context, handler),
    );
    const repeatedResult = await firstValueFrom(
      interceptor.intercept(repeated.context, handler),
    );

    expect(firstResult).toEqual({ id: 10 });
    expect(repeatedResult).toEqual({ id: 10 });
    expect(handler.handle).toHaveBeenCalledTimes(1);
    expect(repeated.response.setHeader).toHaveBeenCalledWith(
      "Idempotency-Replayed",
      "true",
    );
  });

  it("rechaza reutilizar la clave con un cuerpo diferente", () => {
    const interceptor = new IdempotencyInterceptor();
    const handler: CallHandler = { handle: jest.fn(() => of({ id: 10 })) };
    const first = createContext("offline-operation-456", { value: 1 });
    const conflicting = createContext("offline-operation-456", { value: 2 });

    interceptor.intercept(first.context, handler);

    expect(() => interceptor.intercept(conflicting.context, handler)).toThrow(
      "Idempotency-Key ya fue utilizada con otros datos",
    );
  });
});
