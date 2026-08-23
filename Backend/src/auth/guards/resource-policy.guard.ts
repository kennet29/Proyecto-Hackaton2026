/**
 * @file Backend/src/auth/guards/resource-policy.guard.ts
 * @description TypeScript module implementation.
 */

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Request } from "express";
import { AuthenticatedUser } from "../auth.service";

const ADMIN_ONLY_RESOURCES = new Set([
  "permiso",
  "rol",
  "rolpermiso",
  "usuario",
  "usuariorol",
]);

const ADMIN_MUTATION_RESOURCES = new Set([
  "catalogoservicio",
  "especialidad",
  "institucionhorario",
  "institucionimagen",
  "institucionmedicamento",
  "institucionespecialidad",
  "institucionservicio",
  "institucionsalud",
  "medicamentoraro",
  "tipocondicioncronica",
  "tipodocumentoclinico",
  "tipohabito",
  "tipolesion",
  "tipooperacion",
  "tipovacuna",
]);

@Injectable()
export class ResourcePolicyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    if (context.getType() !== "http") return true;

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as AuthenticatedUser | undefined;
    if (!user) return true;

    const resource = context
      .getClass()
      .name.replace(/Controller$/i, "")
      .toLowerCase();
    const method = request.method.toUpperCase();
    const privileged = ["admin", "superadmin"].includes(
      user.role?.trim().toLowerCase() ?? "",
    );

    const requiresAdmin =
      ADMIN_ONLY_RESOURCES.has(resource) ||
      (ADMIN_MUTATION_RESOURCES.has(resource) && method !== "GET");
    if (requiresAdmin && !privileged) {
      throw new ForbiddenException(
        "esta operación está reservada para administradores",
      );
    }
    return true;
  }
}
