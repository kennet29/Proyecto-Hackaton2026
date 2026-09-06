import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Repository } from "typeorm";
import { GastoMedicoPresupuestado } from "./gastomedico.entity";
import { PresupuestoMedico } from "./presupuestomedico.entity";
import { PresupuestoMedicoService } from "./presupuestomedico.service";

type MockRepository<T> = {
  [K in keyof Repository<T>]?: jest.Mock;
};

const budget: PresupuestoMedico = {
  id: 10,
  usuarioId: 7,
  month: "2026-09",
  limit: 5000,
  creadoEn: new Date("2026-09-01T00:00:00Z"),
  modificadoEn: new Date("2026-09-01T00:00:00Z"),
};

const expense: GastoMedicoPresupuestado = {
  id: 20,
  presupuestoMedicoId: 10,
  description: "Consulta general",
  category: "Consultas",
  amount: 800,
  creadoEn: new Date("2026-09-02T00:00:00Z"),
  modificadoEn: new Date("2026-09-02T00:00:00Z"),
};

describe("PresupuestoMedicoService", () => {
  let budgets: MockRepository<PresupuestoMedico>;
  let expenses: MockRepository<GastoMedicoPresupuestado>;
  let service: PresupuestoMedicoService;

  beforeEach(() => {
    budgets = {
      findOne: jest.fn(),
      findOneByOrFail: jest.fn(),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
    };
    expenses = {
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
      remove: jest.fn(async (value) => value),
      createQueryBuilder: jest.fn(),
    };
    service = new PresupuestoMedicoService(
      budgets as unknown as Repository<PresupuestoMedico>,
      expenses as unknown as Repository<GastoMedicoPresupuestado>,
    );
  });

  it("devuelve un presupuesto vacío cuando el usuario aún no tiene registros en el mes", async () => {
    budgets.findOne!.mockResolvedValue(null);

    await expect(service.obtener(7, "2026-09")).resolves.toEqual({
      id: null,
      month: "2026-09",
      limit: 0,
      items: [],
    });
    expect(budgets.findOne).toHaveBeenCalledWith({ where: { usuarioId: 7, month: "2026-09" } });
  });

  it("rechaza meses con un formato o número de mes inválido", async () => {
    await expect(service.obtener(7, "09-2026")).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.obtener(7, "2026-13")).rejects.toBeInstanceOf(BadRequestException);
  });

  it("actualiza el límite del presupuesto existente", async () => {
    const existing = { ...budget };
    budgets.findOne!.mockResolvedValue(existing);
    budgets.save!.mockImplementation(async (value) => value);

    const result = await service.actualizarLimite(7, "2026-09", { limit: 6500 });

    expect(budgets.save).toHaveBeenCalledWith(expect.objectContaining({ id: 10, limit: 6500 }));
    expect(result).toEqual(expect.objectContaining({ id: 10, month: "2026-09", limit: 6500 }));
  });

  it("crea un gasto y devuelve el mes actualizado", async () => {
    budgets.findOne!.mockResolvedValue({ ...budget });
    expenses.find!.mockResolvedValue([{ ...expense }]);

    const result = await service.crearGasto(7, "2026-09", {
      description: "Consulta general",
      category: "Consultas",
      amount: 800,
    });

    expect(expenses.create).toHaveBeenCalledWith(expect.objectContaining({ presupuestoMedicoId: 10, amount: 800 }));
    expect(expenses.save).toHaveBeenCalledTimes(1);
    expect(result.items).toEqual([expect.objectContaining({ id: 20, amount: 800 })]);
  });

  it("edita únicamente un gasto encontrado dentro del presupuesto del usuario", async () => {
    const ownedExpense = { ...expense };
    expenses.createQueryBuilder!.mockReturnValue(queryBuilderResolving(ownedExpense));
    budgets.findOneByOrFail!.mockResolvedValue({ ...budget });
    expenses.find!.mockImplementation(async () => [ownedExpense]);

    const result = await service.editarGasto(7, 20, {
      description: "Examen de laboratorio",
      category: "Exámenes",
      amount: 1200,
    });

    expect(expenses.save).toHaveBeenCalledWith(expect.objectContaining({
      id: 20,
      description: "Examen de laboratorio",
      category: "Exámenes",
      amount: 1200,
    }));
    expect(result.items[0]).toEqual(expect.objectContaining({ description: "Examen de laboratorio", amount: 1200 }));
  });

  it("impide editar un gasto que no pertenece al usuario autenticado", async () => {
    expenses.createQueryBuilder!.mockReturnValue(queryBuilderResolving(null));

    await expect(service.editarGasto(99, 20, {
      description: "Intento ajeno",
      category: "Otros",
      amount: 1,
    })).rejects.toBeInstanceOf(NotFoundException);
    expect(expenses.save).not.toHaveBeenCalled();
  });

  it("elimina un gasto propio y devuelve el presupuesto actualizado", async () => {
    expenses.createQueryBuilder!.mockReturnValue(queryBuilderResolving({ ...expense }));
    budgets.findOneByOrFail!.mockResolvedValue({ ...budget });

    const result = await service.eliminarGasto(7, 20);

    expect(expenses.remove).toHaveBeenCalledWith(expect.objectContaining({ id: 20 }));
    expect(result.items).toEqual([]);
  });
});

function queryBuilderResolving(value: GastoMedicoPresupuestado | null) {
  const queryBuilder = {
    innerJoin: jest.fn(),
    where: jest.fn(),
    andWhere: jest.fn(),
    getOne: jest.fn().mockResolvedValue(value),
  };
  queryBuilder.innerJoin.mockReturnValue(queryBuilder);
  queryBuilder.where.mockReturnValue(queryBuilder);
  queryBuilder.andWhere.mockReturnValue(queryBuilder);
  return queryBuilder;
}
