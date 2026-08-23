/**
 * @file Backend/src/auth/interceptors/patient-resource-access.interceptor.ts
 * @description TypeScript module implementation.
 */

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Request } from "express";
import { Observable, mergeMap } from "rxjs";
import { AuthenticatedUser } from "../auth.service";
import { PatientResourceAccessService } from "../patient-resource-access.service";

@Injectable()
export class PatientResourceAccessInterceptor implements NestInterceptor {
  constructor(
    private readonly patientResourceAccessService: PatientResourceAccessService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    if (context.getType() !== "http") return next.handle();

    const controllerName = context.getClass().name;
    if (
      !this.patientResourceAccessService.isProtectedResource(controllerName)
    ) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as AuthenticatedUser;
    await this.patientResourceAccessService.assertRequestAccess(
      user,
      controllerName,
      request,
    );

    const patientBoundRequest = [request.params, request.query, request.body]
      .some((source) => source?.pacienteId !== undefined);
    const recordBoundRequest = request.params?.id !== undefined;
    if (
      request.method.toUpperCase() !== "GET" ||
      patientBoundRequest ||
      recordBoundRequest
    ) {
      return next.handle();
    }

    return next.handle().pipe(
      mergeMap((value) =>
        this.patientResourceAccessService.protectResponse(
          user,
          controllerName,
          value,
        ),
      ),
    );
  }
}
