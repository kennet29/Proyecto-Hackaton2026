import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ActualizarLimiteDto, GuardarGastoDto } from "./dto/presupuesto-medico.dto";
import { GastoMedicoPresupuestado } from "./gastomedico.entity";
import { PresupuestoMedico } from "./presupuestomedico.entity";

@Injectable()
export class PresupuestoMedicoService {
  constructor(
    @InjectRepository(PresupuestoMedico) private readonly budgets: Repository<PresupuestoMedico>,
    @InjectRepository(GastoMedicoPresupuestado) private readonly expenses: Repository<GastoMedicoPresupuestado>,
  ) {}

  async obtener(usuarioId: number, month: string) {
    this.validarMes(month);
    const budget = await this.budgets.findOne({ where: { usuarioId, month } });
    return budget ? this.resumen(budget) : { id: null, month, limit: 0, items: [] };
  }

  async actualizarLimite(usuarioId: number, month: string, payload: ActualizarLimiteDto) {
    this.validarMes(month);
    let budget = await this.budgets.findOne({ where: { usuarioId, month } });
    if (!budget) budget = this.budgets.create({ usuarioId, month, limit: payload.limit });
    else budget.limit = payload.limit;
    return this.resumen(await this.budgets.save(budget));
  }

  async crearGasto(usuarioId: number, month: string, payload: GuardarGastoDto) {
    this.validarMes(month);
    let budget = await this.budgets.findOne({ where: { usuarioId, month } });
    if (!budget) budget = await this.budgets.save(this.budgets.create({ usuarioId, month, limit: 0 }));
    await this.expenses.save(this.expenses.create({
      presupuestoMedicoId: budget.id,
      description: payload.description,
      category: payload.category,
      amount: payload.amount,
    }));
    return this.resumen(budget);
  }

  async editarGasto(usuarioId: number, id: number, payload: GuardarGastoDto) {
    const expense = await this.buscarGastoPropio(usuarioId, id);
    expense.description = payload.description;
    expense.category = payload.category;
    expense.amount = payload.amount;
    await this.expenses.save(expense);
    const budget = await this.budgets.findOneByOrFail({ id: expense.presupuestoMedicoId });
    return this.resumen(budget);
  }

  async eliminarGasto(usuarioId: number, id: number) {
    const expense = await this.buscarGastoPropio(usuarioId, id);
    const budget = await this.budgets.findOneByOrFail({ id: expense.presupuestoMedicoId });
    await this.expenses.remove(expense);
    return this.resumen(budget);
  }

  private async buscarGastoPropio(usuarioId: number, id: number) {
    const expense = await this.expenses.createQueryBuilder("gasto")
      .innerJoin(PresupuestoMedico, "presupuesto", "presupuesto.presupuestomedicoid = gasto.presupuestomedicoid")
      .where("gasto.gastomedicoid = :id", { id })
      .andWhere("presupuesto.usuarioid = :usuarioId", { usuarioId })
      .getOne();
    if (!expense) throw new NotFoundException(`gasto ${id} no encontrado`);
    return expense;
  }

  private async resumen(budget: PresupuestoMedico) {
    const items = await this.expenses.find({ where: { presupuestoMedicoId: budget.id }, order: { creadoEn: "ASC" } });
    return {
      id: budget.id,
      month: budget.month.trim(),
      limit: Number(budget.limit),
      items: items.map((item) => ({
        id: item.id,
        description: item.description,
        category: item.category,
        amount: Number(item.amount),
      })),
    };
  }

  private validarMes(month: string): void {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new BadRequestException("mes debe usar el formato YYYY-MM");
  }
}
