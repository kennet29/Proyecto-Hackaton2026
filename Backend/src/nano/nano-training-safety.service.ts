import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { Condicioncronica } from "../modules/condicioncronica/condicioncronica.entity";
import { Embarazo } from "../modules/embarazo/embarazo.entity";
import { Lesion } from "../modules/lesion/lesion.entity";
import { Seguimientopostevento } from "../modules/seguimientopostevento/seguimientopostevento.entity";
import { Tipocondicioncronica } from "../modules/tipocondicioncronica/tipocondicioncronica.entity";
import { TrainingSafetyFlag } from "./dto/create-training-plan.dto";

@Injectable()
export class NanoTrainingSafetyService {
  constructor(
    @InjectRepository(Lesion) private readonly lesiones: Repository<Lesion>,
    @InjectRepository(Embarazo) private readonly embarazos: Repository<Embarazo>,
    @InjectRepository(Condicioncronica) private readonly condiciones: Repository<Condicioncronica>,
    @InjectRepository(Tipocondicioncronica) private readonly tiposCondicion: Repository<Tipocondicioncronica>,
    @InjectRepository(Seguimientopostevento) private readonly seguimientos: Repository<Seguimientopostevento>,
  ) {}

  async getRecordedFlags(pacienteId?: number): Promise<TrainingSafetyFlag[]> {
    if (!pacienteId) return [];
    const [lesiones, embarazos, condiciones, seguimientos] = await Promise.all([
      this.lesiones.find({ where: { pacienteId } }),
      this.embarazos.find({ where: { pacienteId } }),
      this.condiciones.find({ where: { pacienteId } }),
      this.seguimientos.find({ where: { pacienteId } }),
    ]);
    const flags = new Set<TrainingSafetyFlag>();

    if (lesiones.some((lesion) => !lesion.recuperado)) flags.add("injury");
    if (seguimientos.some((record) => (record.nivelDolor ?? 0) >= 4)) flags.add("pain");

    const closedPregnancyStates = new Set(["finalizado", "completado", "cancelado", "inactivo"]);
    if (embarazos.some((record) => !closedPregnancyStates.has(record.estado.trim().toLowerCase()) && /alto|riesgo|complic/i.test(`${record.riesgo ?? ""} ${record.antecedentesRelevantes ?? ""} ${record.notas ?? ""}`))) {
      flags.add("high-risk-pregnancy");
    }

    const activeConditions = condiciones.filter((record) => !["inactivo", "resuelto", "finalizado"].includes(record.estado.trim().toLowerCase()));
    if (activeConditions.length) {
      const typeIds = [...new Set(activeConditions.map((record) => record.tipocondicionId))];
      const types = typeIds.length ? await this.tiposCondicion.find({ where: { tipocondicionId: In(typeIds) } }) : [];
      const names = new Map(types.map((item) => [item.tipocondicionId, `${item.nombre} ${item.descripcion ?? ""} ${item.categoria ?? ""}`]));
      if (activeConditions.some((record) => /cardio|coraz[oó]n|hiperten/i.test(`${names.get(record.tipocondicionId) ?? ""} ${record.tratamientoprincipal ?? ""} ${record.notas ?? ""}`))) {
        flags.add("cardiovascular-condition");
      }
    }

    return [...flags];
  }
}
