/**
 * @file Backend/src/auth/patient-resource-access.service.ts
 * @description TypeScript module implementation.
 */

import { ForbiddenException, Injectable } from "@nestjs/common";
import { DataSource, EntityMetadata } from "typeorm";
import { AuthenticatedUser } from "./auth.service";
import { PacienteAccessService } from "./paciente-access.service";

const PATIENT_RESOURCES = new Set([
  "adherenciacronica",
  "alergia",
  "antecedentefamiliar",
  "citamedica",
  "condicioncronica",
  "controlcronico",
  "controlprenatal",
  "desparasitacion",
  "detalleevaluacionsalud",
  "documentoclinico",
  "embarazo",
  "estilovida",
  "evaluacionsaludhabito",
  "examenclinico",
  "habitoespecifico",
  "horariomedicamento",
  "lesion",
  "medicacion",
  "notificacion",
  "objetivocronico",
  "operacion",
  "periodo",
  "puntajeriesgo",
  "recordatoriocita",
  "registrodental",
  "registromensual",
  "seguimientofisico",
  "seguimientopostevento",
  "vacuna",
]);

const PARENT_REFERENCES: Record<
  string,
  { property: string; parentResource: string }
> = {
  adherenciacronica: {
    property: "condicioncronicaId",
    parentResource: "condicioncronica",
  },
  controlcronico: {
    property: "condicioncronicaId",
    parentResource: "condicioncronica",
  },
  controlprenatal: { property: "embarazoId", parentResource: "embarazo" },
  detalleevaluacionsalud: {
    property: "evaluacionId",
    parentResource: "evaluacionsaludhabito",
  },
  horariomedicamento: {
    property: "medicacionId",
    parentResource: "medicacion",
  },
  objetivocronico: {
    property: "condicioncronicaId",
    parentResource: "condicioncronica",
  },
};

type HttpRequest = {
  method?: string;
  params?: Record<string, unknown>;
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
};

@Injectable()
export class PatientResourceAccessService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly pacienteAccessService: PacienteAccessService,
  ) {}

  isProtectedResource(controllerName: string): boolean {
    return PATIENT_RESOURCES.has(this.resourceFromController(controllerName));
  }

  isPrivileged(user: AuthenticatedUser): boolean {
    const role = user?.role?.trim().toLowerCase();
    return role === "admin" || role === "superadmin";
  }

  async assertRequestAccess(
    user: AuthenticatedUser,
    controllerName: string,
    request: HttpRequest,
  ): Promise<void> {
    if (this.isPrivileged(user)) return;

    const resource = this.resourceFromController(controllerName);
    const method = request.method?.toUpperCase() ?? "GET";
    const patientIds = new Set<number>();

    const metadata = this.getMetadata(resource);
    const recordId = request.params?.id;
    if (recordId !== undefined && recordId !== null && recordId !== "") {
      const record = await this.findRecord(metadata, recordId);
      const recordPatientId = await this.resolvePatientId(resource, record);
      if (recordPatientId) patientIds.add(recordPatientId);
    }

    for (const source of [request.params, request.query, request.body]) {
      const directId = this.toPositiveInt(source?.pacienteId);
      if (directId) patientIds.add(directId);
    }

    const bodyPatientId = await this.resolvePatientId(resource, request.body);
    if (bodyPatientId) patientIds.add(bodyPatientId);

    if (method !== "GET" && patientIds.size === 0) {
      throw new ForbiddenException(
        "no se pudo verificar el paciente asociado a la operación",
      );
    }

    for (const pacienteId of patientIds) {
      await this.pacienteAccessService.assertAccess(user, pacienteId);
    }
  }

  async protectResponse<T>(
    user: AuthenticatedUser,
    controllerName: string,
    value: T,
  ): Promise<T> {
    if (this.isPrivileged(user) || value === null || value === undefined) {
      return value;
    }

    const resource = this.resourceFromController(controllerName);
    const accessCache = new Map<number, boolean>();
    if (Array.isArray(value)) {
      const visible: unknown[] = [];
      for (const item of value) {
        const pacienteId = await this.resolvePatientId(resource, item);
        if (
          pacienteId &&
          (await this.hasAccess(user, pacienteId, accessCache))
        ) {
          visible.push(item);
        }
      }
      return visible as T;
    }

    const pacienteId = await this.resolvePatientId(resource, value);
    if (pacienteId) {
      await this.pacienteAccessService.assertAccess(user, pacienteId);
    }
    return value;
  }

  private async hasAccess(
    user: AuthenticatedUser,
    pacienteId: number,
    cache: Map<number, boolean>,
  ): Promise<boolean> {
    const cached = cache.get(pacienteId);
    if (cached !== undefined) return cached;
    try {
      await this.pacienteAccessService.assertAccess(user, pacienteId);
      cache.set(pacienteId, true);
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        cache.set(pacienteId, false);
        return false;
      }
      throw error;
    }
  }

  private async resolvePatientId(
    resource: string,
    candidate: unknown,
  ): Promise<number | null> {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
      return null;
    }
    const record = candidate as Record<string, unknown>;
    const directId = this.toPositiveInt(record.pacienteId);
    if (directId) return directId;

    const parent = PARENT_REFERENCES[resource];
    if (!parent) return null;
    const parentId = this.toPositiveInt(record[parent.property]);
    if (!parentId) return null;
    const parentMetadata = this.getMetadata(parent.parentResource);
    const parentRecord = await this.findRecord(parentMetadata, parentId);
    return this.resolvePatientId(parent.parentResource, parentRecord);
  }

  private async findRecord(
    metadata: EntityMetadata,
    rawId: unknown,
  ): Promise<Record<string, unknown> | null> {
    const segments = String(rawId)
      .split(",")
      .map((segment) => segment.trim());
    if (!metadata.primaryColumns.length || segments.length !== metadata.primaryColumns.length) {
      return null;
    }
    const where: Record<string, unknown> = {};
    metadata.primaryColumns.forEach((column, index) => {
      const value = segments[index];
      where[column.propertyName] =
        column.type === Number || /int|decimal|numeric/i.test(String(column.type))
          ? Number(value)
          : value;
    });
    return (await this.dataSource
      .getRepository(metadata.target)
      .findOne({ where })) as Record<string, unknown> | null;
  }

  private getMetadata(resource: string): EntityMetadata {
    const metadata = this.dataSource.entityMetadatas.find(
      (item) =>
        item.targetName.toLowerCase() === resource ||
        item.tableName.toLowerCase() === resource,
    );
    if (!metadata) {
      throw new ForbiddenException(
        "no se pudo verificar el recurso clínico solicitado",
      );
    }
    return metadata;
  }

  private resourceFromController(controllerName: string): string {
    return controllerName.replace(/Controller$/i, "").toLowerCase();
  }

  private toPositiveInt(value: unknown): number | null {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }
}
