import { PacienteService } from "./paciente.service";

describe("PacienteService clinical history schema compatibility", () => {
  it("selects only columns that exist in the deployed table", async () => {
    const getMany = jest.fn().mockResolvedValue([{ embarazoId: 1, pacienteId: 1 }]);
    const where = jest.fn().mockReturnValue({ getMany });
    const select = jest.fn().mockReturnValue({ where });
    const repository = {
      metadata: {
        tableName: "embarazo",
        columns: [
          { databaseName: "embarazoid", propertyName: "embarazoId", propertyPath: "embarazoId" },
          { databaseName: "pacienteid", propertyName: "pacienteId", propertyPath: "pacienteId" },
          { databaseName: "fechainicio", propertyName: "fechainicio", propertyPath: "fechainicio" },
          { databaseName: "centromedico", propertyName: "centroMedico", propertyPath: "centroMedico" },
        ],
      },
      query: jest.fn().mockResolvedValue([
        { columnName: "embarazoid", dataType: "int" },
        { columnName: "pacienteid", dataType: "int" },
        { columnName: "fechainicio", dataType: "date" },
      ]),
      createQueryBuilder: jest.fn().mockReturnValue({ select }),
    };
    const service = Object.create(PacienteService.prototype) as PacienteService;
    (service as any).historyColumnCache = new Map();

    await (service as any).findHistoryRecords(repository, 1);

    expect(select).toHaveBeenCalledWith([
      "historyRecord.embarazoId",
      "historyRecord.pacienteId",
      "historyRecord.fechainicio",
    ]);
    expect(where).toHaveBeenCalledWith(
      "historyRecord.pacienteId = :pacienteId",
      { pacienteId: 1 },
    );
    expect(getMany).toHaveBeenCalled();
  });
});
