import { ForbiddenException } from "@nestjs/common";
import { PatientResourceAccessService } from "./patient-resource-access.service";

describe("PatientResourceAccessService", () => {
  const user = { userId: 7, username: "paciente", role: "paciente" };
  const targets = {
    alergia: class Alergia {},
    embarazo: class Embarazo {},
    controlprenatal: class Controlprenatal {},
  };
  const metadata = [
    {
      target: targets.alergia,
      targetName: "Alergia",
      tableName: "alergia",
      primaryColumns: [{ propertyName: "alergiaId", type: Number }],
    },
    {
      target: targets.embarazo,
      targetName: "Embarazo",
      tableName: "embarazo",
      primaryColumns: [{ propertyName: "embarazoId", type: Number }],
    },
    {
      target: targets.controlprenatal,
      targetName: "Controlprenatal",
      tableName: "controlprenatal",
      primaryColumns: [{ propertyName: "controlId", type: Number }],
    },
  ];

  const records = new Map<unknown, Record<number, Record<string, unknown>>>([
    [
      targets.alergia,
      {
        10: { alergiaId: 10, pacienteId: 1, tipo: "Polen" },
        20: { alergiaId: 20, pacienteId: 2, tipo: "Mariscos" },
      },
    ],
    [targets.embarazo, { 30: { embarazoId: 30, pacienteId: 1 } }],
    [
      targets.controlprenatal,
      { 40: { controlId: 40, embarazoId: 30 } },
    ],
  ]);

  const buildService = () => {
    const pacienteAccessService = {
      assertAccess: jest.fn(async (_actor, pacienteId: number) => {
        if (pacienteId !== 1) {
          throw new ForbiddenException("sin acceso");
        }
      }),
    };
    const dataSource = {
      entityMetadatas: metadata,
      getRepository: jest.fn((target: unknown) => ({
        findOne: jest.fn(async ({ where }: { where: Record<string, number> }) => {
          const id = Number(Object.values(where)[0]);
          return records.get(target)?.[id] ?? null;
        }),
      })),
    };
    return {
      pacienteAccessService,
      service: new PatientResourceAccessService(
        dataSource as never,
        pacienteAccessService as never,
      ),
    };
  };

  it("filters collection records that belong to another patient", async () => {
    const { service } = buildService();
    const result = await service.protectResponse(user, "AlergiaController", [
      records.get(targets.alergia)?.[10],
      records.get(targets.alergia)?.[20],
    ]);

    expect(result).toEqual([records.get(targets.alergia)?.[10]]);
  });

  it("rejects an update before the handler when the record is unauthorized", async () => {
    const { service } = buildService();

    await expect(
      service.assertRequestAccess(user, "AlergiaController", {
        method: "PATCH",
        params: { id: "20" },
        body: { tipo: "Cambio" },
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("checks both patients when an update attempts to transfer a record", async () => {
    const { service, pacienteAccessService } = buildService();

    await expect(
      service.assertRequestAccess(user, "AlergiaController", {
        method: "PATCH",
        params: { id: "10" },
        body: { pacienteId: 2 },
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(pacienteAccessService.assertAccess).toHaveBeenCalledWith(user, 1);
    expect(pacienteAccessService.assertAccess).toHaveBeenCalledWith(user, 2);
  });

  it("resolves patient ownership through a parent clinical record", async () => {
    const { service, pacienteAccessService } = buildService();

    await service.assertRequestAccess(user, "ControlprenatalController", {
      method: "POST",
      body: { embarazoId: 30 },
    });

    expect(pacienteAccessService.assertAccess).toHaveBeenCalledWith(user, 1);
  });

  it("fails closed when a clinical mutation has no resolvable patient", async () => {
    const { service } = buildService();

    await expect(
      service.assertRequestAccess(user, "AlergiaController", {
        method: "POST",
        body: { tipo: "Sin paciente" },
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("lets administrators manage all patient resources", async () => {
    const { service, pacienteAccessService } = buildService();

    await service.assertRequestAccess(
      { ...user, role: "admin" },
      "AlergiaController",
      { method: "DELETE", params: { id: "20" } },
    );

    expect(pacienteAccessService.assertAccess).not.toHaveBeenCalled();
  });
});
