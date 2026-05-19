import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import { AuthenticatedUser } from "../auth.service";
import { ROLES_KEY } from "../decorators/roles.decorator";
import { hasAnyRole } from "../utils/role.util";

/**
 * Guard de NestJS que protege el acceso relacionado con roles guard.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  /**
   * Can activate.
   * @param context Contexto de ejecución actual.
   * @returns Indicador de si la condición evaluada se cumple.
   */
  canActivate(context: ExecutionContext): boolean {
    const allowedRoles =
      this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (!allowedRoles.length) {
      return true;
    }

    const req = context.switchToHttp().getRequest<Request>();
    const user = req.user as AuthenticatedUser | undefined;
    if (!hasAnyRole(user, allowedRoles)) {
      throw new ForbiddenException(
        "no tienes permisos para realizar esta accion",
      );
    }

    return true;
  }
}
