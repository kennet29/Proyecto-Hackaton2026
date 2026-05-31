import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Paciente } from "../paciente/paciente.entity";
import { CreateSeguimientofisicoDto } from "./dto/create-seguimientofisico.dto";
import { UpdateSeguimientofisicoDto } from "./dto/update-seguimientofisico.dto";
import { Seguimientofisico } from "./seguimientofisico.entity";

type SeguimientoFisicoResponse = {
  seguimientoFisicoId: number;
  pacienteId: number;
  fecha: string;
  peso: number | null;
  minutosEjercicio: number | null;
  tipoEjercicio: string | null;
  intensidad: string | null;
  pasos: number | null;
  caloriasQuemadas: number | null;
  distanciaKm: number | null;
  notas: string | null;
  creadoPor: string | null;
  creadoEn: string;
  modificadoPor: string | null;
  modificadoEn: string | null;
  campoPrueba01: string | null;
  campoPrueba02: string | null;
  campoPrueba03: string | null;
  campoPrueba04: string | null;
  campoPrueba05: string | null;
};

type AchievementCategory = "constancia" | "actividad" | "seguimiento";

type AchievementMetricKey =
  | "totalRegistros"
  | "rachaMaxima"
  | "minutosMaximos"
  | "pasosMaximos"
  | "distanciaAcumulada"
  | "tiposEjercicioUnicos"
  | "sesionesIntensas"
  | "registrosCompletos"
  | "registrosConPeso";

type AchievementDefinition = {
  code: string;
  title: string;
  description: string;
  category: AchievementCategory;
  metricKey: AchievementMetricKey;
  target: number;
  unit: string;
};

type AchievementStatus = AchievementDefinition & {
  unlocked: boolean;
  progress: number;
  progressPercent: number;
  progressLabel: string;
};

type AchievementMetrics = {
  totalRegistros: number;
  diasRegistrados: number;
  rachaActual: number;
  rachaMaxima: number;
  minutosMaximos: number;
  pasosMaximos: number;
  distanciaAcumulada: number;
  tiposEjercicioUnicos: number;
  sesionesIntensas: number;
  registrosCompletos: number;
  registrosConPeso: number;
};

type AchievementSummaryResponse = {
  pacienteId: number;
  total: number;
  desbloqueados: number;
  progresoResumen: AchievementMetrics;
  logros: AchievementStatus[];
  proximos: AchievementStatus[];
};

type SeguimientoFisicoCreateResponse = SeguimientoFisicoResponse & {
  logrosDesbloqueados: AchievementStatus[];
};

const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    code: "primer_paso",
    title: "Primer paso",
    description: "Crea tu primer registro de seguimiento fisico.",
    category: "seguimiento",
    metricKey: "totalRegistros",
    target: 1,
    unit: "registros",
  },
  {
    code: "semana_activa",
    title: "Semana activa",
    description: "Registra actividad en 7 dias distintos.",
    category: "constancia",
    metricKey: "totalRegistros",
    target: 7,
    unit: "registros",
  },
  {
    code: "constancia_3",
    title: "Constancia 3",
    description: "Mantiene una racha de 3 dias seguidos.",
    category: "constancia",
    metricKey: "rachaMaxima",
    target: 3,
    unit: "dias",
  },
  {
    code: "constancia_7",
    title: "Constancia 7",
    description: "Mantiene una racha de 7 dias seguidos.",
    category: "constancia",
    metricKey: "rachaMaxima",
    target: 7,
    unit: "dias",
  },
  {
    code: "meta_30",
    title: "Meta 30",
    description: "Llega a 30 minutos de ejercicio en un dia.",
    category: "actividad",
    metricKey: "minutosMaximos",
    target: 30,
    unit: "min",
  },
  {
    code: "meta_60",
    title: "Meta 60",
    description: "Llega a 60 minutos de ejercicio en un dia.",
    category: "actividad",
    metricKey: "minutosMaximos",
    target: 60,
    unit: "min",
  },
  {
    code: "pasos_10000",
    title: "10k",
    description: "Alcanza 10000 pasos en un solo registro.",
    category: "actividad",
    metricKey: "pasosMaximos",
    target: 10000,
    unit: "pasos",
  },
  {
    code: "distancia_5",
    title: "Kilometros en marcha",
    description: "Acumula 5 km entre todos tus registros.",
    category: "actividad",
    metricKey: "distanciaAcumulada",
    target: 5,
    unit: "km",
  },
  {
    code: "explorador_3",
    title: "Explorador",
    description: "Registra 3 tipos distintos de ejercicio.",
    category: "actividad",
    metricKey: "tiposEjercicioUnicos",
    target: 3,
    unit: "tipos",
  },
  {
    code: "intensa_5",
    title: "Alta intensidad",
    description: "Completa 5 sesiones con intensidad intensa.",
    category: "actividad",
    metricKey: "sesionesIntensas",
    target: 5,
    unit: "sesiones",
  },
  {
    code: "seguimiento_completo_10",
    title: "Seguimiento completo",
    description: "Guarda 10 registros con al menos 4 campos clave llenos.",
    category: "seguimiento",
    metricKey: "registrosCompletos",
    target: 10,
    unit: "registros",
  },
  {
    code: "peso_7",
    title: "Monitoreo de peso",
    description: "Registra tu peso en 7 fechas distintas.",
    category: "seguimiento",
    metricKey: "registrosConPeso",
    target: 7,
    unit: "registros",
  },
];

@Injectable()
export class SeguimientofisicoService {
  constructor(
    @InjectRepository(Seguimientofisico)
    private readonly seguimientoRepository: Repository<Seguimientofisico>,
    @InjectRepository(Paciente)
    private readonly pacienteRepository: Repository<Paciente>,
  ) {}

  async create(
    payload: CreateSeguimientofisicoDto,
  ): Promise<SeguimientoFisicoCreateResponse> {
    await this.assertPacienteExists(payload.pacienteId);
    await this.assertUniqueDate(payload.pacienteId, payload.fecha);

    const recordsBefore = await this.findRecords(payload.pacienteId);
    const achievementsBefore =
      this.evaluateAchievements(recordsBefore).statuses;
    const entity = this.seguimientoRepository.create(
      this.mapPayloadForSave(payload, true),
    );
    const saved = await this.seguimientoRepository.save(entity);
    const recordsAfter = [...recordsBefore, saved].sort((a, b) =>
      this.compareRecords(a, b),
    );
    const achievementsAfter = this.evaluateAchievements(recordsAfter).statuses;

    return {
      ...this.toResponse(saved),
      logrosDesbloqueados: this.getNewlyUnlockedAchievements(
        achievementsBefore,
        achievementsAfter,
      ),
    };
  }

  async findAll(
    pacienteId?: number,
    desde?: string,
    hasta?: string,
  ): Promise<SeguimientoFisicoResponse[]> {
    const records = await this.findRecords(pacienteId, desde, hasta);
    return records.map((record) => this.toResponse(record));
  }

  async findOne(id: number): Promise<SeguimientoFisicoResponse> {
    const entity = await this.findEntity(id);
    return this.toResponse(entity);
  }

  async update(
    id: number,
    payload: UpdateSeguimientofisicoDto,
  ): Promise<SeguimientoFisicoResponse> {
    const entity = await this.findEntity(id);
    const nextPacienteId = entity.pacienteId;
    const nextFecha = payload.fecha ?? entity.fecha;

    if (this.toIsoDate(nextFecha) !== this.toIsoDate(entity.fecha)) {
      await this.assertUniqueDate(nextPacienteId, nextFecha, id);
    }

    Object.assign(entity, this.mapPayloadForSave(payload, false));
    const saved = await this.seguimientoRepository.save(entity);
    return this.toResponse(saved);
  }

  async remove(id: number): Promise<void> {
    await this.findEntity(id);
    const result = await this.seguimientoRepository.delete({
      seguimientoFisicoId: id,
    });
    if (!result.affected) {
      throw new NotFoundException(
        `registro ${id} no encontrado en seguimientofisico`,
      );
    }
  }

  async getHistorial(pacienteId: number, desde?: string, hasta?: string) {
    await this.assertPacienteExists(pacienteId);
    const records = await this.findRecords(pacienteId, desde, hasta);
    return {
      pacienteId,
      totalRegistros: records.length,
      registros: records.map((record) => this.toResponse(record)),
    };
  }

  async getResumen(pacienteId: number, desde?: string, hasta?: string) {
    await this.assertPacienteExists(pacienteId);
    const records = await this.findRecords(pacienteId, desde, hasta);
    const pesos = records
      .map((record) => record.peso)
      .filter((value): value is number => typeof value === "number");
    const ejercicios = records
      .map((record) => record.minutosEjercicio)
      .filter((value): value is number => typeof value === "number");
    const pasos = records
      .map((record) => record.pasos)
      .filter((value): value is number => typeof value === "number");
    const calorias = records
      .map((record) => record.caloriasQuemadas)
      .filter((value): value is number => typeof value === "number");

    return {
      pacienteId,
      totalRegistros: records.length,
      ultimoRegistro: records.length
        ? this.toResponse(records[records.length - 1])
        : null,
      peso: {
        inicial: pesos.length ? pesos[0] : null,
        actual: pesos.length ? pesos[pesos.length - 1] : null,
        cambio:
          pesos.length > 1
            ? Math.round((pesos[pesos.length - 1] - pesos[0]) * 100) / 100
            : null,
      },
      ejercicio: {
        minutosTotales: this.sum(ejercicios),
        minutosPromedio: this.average(ejercicios),
        caloriasTotales: this.sum(calorias),
        pasosPromedio: this.average(pasos),
      },
    };
  }

  async getPesoProgress(pacienteId: number, desde?: string, hasta?: string) {
    await this.assertPacienteExists(pacienteId);
    const records = await this.findRecords(pacienteId, desde, hasta);
    return {
      pacienteId,
      puntos: records
        .filter((record) => typeof record.peso === "number")
        .map((record) => ({
          fecha: this.toIsoDate(record.fecha),
          peso: record.peso as number,
        })),
    };
  }

  async getLogros(pacienteId: number): Promise<AchievementSummaryResponse> {
    await this.assertPacienteExists(pacienteId);
    const records = await this.findRecords(pacienteId);
    return this.buildAchievementSummary(pacienteId, records);
  }

  private async findEntity(id: number): Promise<Seguimientofisico> {
    const entity = await this.seguimientoRepository.findOne({
      where: { seguimientoFisicoId: id },
    });
    if (!entity) {
      throw new NotFoundException(
        `registro ${id} no encontrado en seguimientofisico`,
      );
    }
    await this.assertPacienteExists(entity.pacienteId);
    return entity;
  }

  private async findRecords(
    pacienteId?: number,
    desde?: string,
    hasta?: string,
  ): Promise<Seguimientofisico[]> {
    if (pacienteId !== undefined) {
      await this.assertPacienteExists(pacienteId);
    }
    const fromDate = this.parseOptionalDate(desde);
    const toDate = this.parseOptionalDate(hasta);
    const records = await this.seguimientoRepository.find({
      where: pacienteId !== undefined ? { pacienteId } : {},
      order: { fecha: "ASC", seguimientoFisicoId: "ASC" },
    });
    return records.filter((record) => {
      const time = this.toDate(record.fecha).getTime();
      if (fromDate && time < fromDate.getTime()) {
        return false;
      }
      if (toDate && time > toDate.getTime()) {
        return false;
      }
      return true;
    });
  }

  private mapPayloadForSave(
    payload: CreateSeguimientofisicoDto | UpdateSeguimientofisicoDto,
    isCreate: boolean,
  ): Partial<Seguimientofisico> {
    const mapped: Partial<Seguimientofisico> = {};
    if ("pacienteId" in payload && payload.pacienteId !== undefined) {
      mapped.pacienteId = payload.pacienteId;
    }
    if (payload.fecha !== undefined) {
      mapped.fecha = new Date(payload.fecha);
    }
    if (payload.peso !== undefined) {
      mapped.peso = payload.peso;
    }
    if (payload.minutosEjercicio !== undefined) {
      mapped.minutosEjercicio = payload.minutosEjercicio;
    }
    if (payload.tipoEjercicio !== undefined) {
      mapped.tipoEjercicio = payload.tipoEjercicio;
    }
    if (payload.intensidad !== undefined) {
      mapped.intensidad = payload.intensidad;
    }
    if (payload.pasos !== undefined) {
      mapped.pasos = payload.pasos;
    }
    if (payload.caloriasQuemadas !== undefined) {
      mapped.caloriasQuemadas = payload.caloriasQuemadas;
    }
    if (payload.distanciaKm !== undefined) {
      mapped.distanciaKm = payload.distanciaKm;
    }
    if (payload.notas !== undefined) {
      mapped.notas = payload.notas;
    }
    if (payload.creadoPor !== undefined) {
      mapped.creadoPor = payload.creadoPor;
    }
    if (payload.modificadoPor !== undefined) {
      mapped.modificadoPor = payload.modificadoPor;
    }
    if (payload.campoPrueba01 !== undefined) {
      mapped.campoPrueba01 = payload.campoPrueba01;
    }
    if (payload.campoPrueba02 !== undefined) {
      mapped.campoPrueba02 = payload.campoPrueba02;
    }
    if (payload.campoPrueba03 !== undefined) {
      mapped.campoPrueba03 = payload.campoPrueba03;
    }
    if (payload.campoPrueba04 !== undefined) {
      mapped.campoPrueba04 = payload.campoPrueba04;
    }
    if (payload.campoPrueba05 !== undefined) {
      mapped.campoPrueba05 = payload.campoPrueba05;
    }

    if (isCreate) {
      mapped.creadoEn =
        "creadoEn" in payload && payload.creadoEn
          ? new Date(payload.creadoEn)
          : new Date();
      mapped.modificadoEn =
        "modificadoEn" in payload && payload.modificadoEn
          ? new Date(payload.modificadoEn)
          : undefined;
    } else {
      mapped.modificadoEn =
        "modificadoEn" in payload && payload.modificadoEn
          ? new Date(payload.modificadoEn)
          : new Date();
    }

    return mapped;
  }

  private async assertPacienteExists(pacienteId: number): Promise<void> {
    const paciente = await this.pacienteRepository.findOne({
      where: { pacienteId },
    });
    if (!paciente) {
      throw new NotFoundException(`paciente ${pacienteId} no encontrado`);
    }
  }

  private async assertUniqueDate(
    pacienteId: number,
    fecha: Date,
    ignoreId?: number,
  ): Promise<void> {
    const existing = await this.seguimientoRepository.findOne({
      where: { pacienteId, fecha: new Date(fecha) },
    });
    if (existing && existing.seguimientoFisicoId !== ignoreId) {
      throw new BadRequestException(
        "ya existe un registro de seguimiento fisico para ese paciente en esa fecha",
      );
    }
  }

  private parseOptionalDate(value?: string): Date | undefined {
    if (!value) {
      return undefined;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException("la fecha enviada en filtros es invalida");
    }
    return parsed;
  }

  private buildAchievementSummary(
    pacienteId: number,
    records: Seguimientofisico[],
  ): AchievementSummaryResponse {
    const { metrics, statuses } = this.evaluateAchievements(records);
    const proximos = statuses
      .filter((achievement) => !achievement.unlocked)
      .sort((left, right) => {
        if (right.progressPercent !== left.progressPercent) {
          return right.progressPercent - left.progressPercent;
        }
        return left.target - right.target;
      })
      .slice(0, 3);

    return {
      pacienteId,
      total: statuses.length,
      desbloqueados: statuses.filter((achievement) => achievement.unlocked)
        .length,
      progresoResumen: metrics,
      logros: statuses,
      proximos,
    };
  }

  private evaluateAchievements(records: Seguimientofisico[]): {
    metrics: AchievementMetrics;
    statuses: AchievementStatus[];
  } {
    const metrics = this.buildAchievementMetrics(records);
    const statuses = ACHIEVEMENT_DEFINITIONS.map((definition) => {
      const currentValue = metrics[definition.metricKey];
      const progress = Math.min(currentValue, definition.target);
      const progressPercent = definition.target
        ? Math.min(
            100,
            Math.round((progress / definition.target) * 100),
          )
        : 0;

      return {
        ...definition,
        unlocked: currentValue >= definition.target,
        progress: this.roundNumber(progress),
        progressPercent,
        progressLabel: `${this.formatMetricValue(progress)} / ${this.formatMetricValue(definition.target)} ${definition.unit}`,
      };
    });

    return {
      metrics,
      statuses,
    };
  }

  private buildAchievementMetrics(
    records: Seguimientofisico[],
  ): AchievementMetrics {
    const dateKeys = Array.from(
      new Set(records.map((record) => this.toIsoDate(record.fecha))),
    ).sort((left, right) => left.localeCompare(right));
    const streak = this.calculateStreak(dateKeys);
    const distanceValues = records
      .map((record) => record.distanciaKm)
      .filter((value): value is number => typeof value === "number");
    const maxMinutes = records.reduce(
      (currentMax, record) =>
        Math.max(currentMax, record.minutosEjercicio ?? 0),
      0,
    );
    const maxSteps = records.reduce(
      (currentMax, record) => Math.max(currentMax, record.pasos ?? 0),
      0,
    );
    const uniqueExerciseTypes = new Set(
      records
        .map((record) => record.tipoEjercicio?.trim().toLowerCase())
        .filter((value): value is string => Boolean(value)),
    );

    return {
      totalRegistros: records.length,
      diasRegistrados: dateKeys.length,
      rachaActual: streak.current,
      rachaMaxima: streak.max,
      minutosMaximos: maxMinutes,
      pasosMaximos: maxSteps,
      distanciaAcumulada: this.roundNumber(this.sum(distanceValues) ?? 0),
      tiposEjercicioUnicos: uniqueExerciseTypes.size,
      sesionesIntensas: records.filter(
        (record) => record.intensidad?.toLowerCase() === "intensa",
      ).length,
      registrosCompletos: records.filter((record) => {
        return this.countCompletedCoreFields(record) >= 4;
      }).length,
      registrosConPeso: records.filter(
        (record) => typeof record.peso === "number",
      ).length,
    };
  }

  private getNewlyUnlockedAchievements(
    before: AchievementStatus[],
    after: AchievementStatus[],
  ): AchievementStatus[] {
    const beforeMap = new Map(before.map((achievement) => [achievement.code, achievement]));
    return after.filter((achievement) => {
      return (
        achievement.unlocked &&
        !beforeMap.get(achievement.code)?.unlocked
      );
    });
  }

  private countCompletedCoreFields(record: Seguimientofisico): number {
    const fields = [
      record.peso,
      record.minutosEjercicio,
      record.tipoEjercicio?.trim() ?? null,
      record.intensidad?.trim() ?? null,
      record.pasos,
      record.caloriasQuemadas,
      record.distanciaKm,
    ];

    return fields.filter((value) => {
      if (typeof value === "number") {
        return true;
      }
      return typeof value === "string" && value.length > 0;
    }).length;
  }

  private calculateStreak(dateKeys: string[]): {
    current: number;
    max: number;
  } {
    if (!dateKeys.length) {
      return {
        current: 0,
        max: 0,
      };
    }

    let running = 1;
    let max = 1;

    for (let index = 1; index < dateKeys.length; index += 1) {
      const previous = this.parseDateKey(dateKeys[index - 1]);
      const current = this.parseDateKey(dateKeys[index]);
      const diffInDays = Math.round(
        (current.getTime() - previous.getTime()) / 86400000,
      );

      if (diffInDays === 1) {
        running += 1;
      } else {
        running = 1;
      }

      if (running > max) {
        max = running;
      }
    }

    return {
      current: running,
      max,
    };
  }

  private parseDateKey(value: string): Date {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  }

  private compareRecords(
    left: Seguimientofisico,
    right: Seguimientofisico,
  ): number {
    const dateCompare = this.toIsoDate(left.fecha).localeCompare(
      this.toIsoDate(right.fecha),
    );
    if (dateCompare !== 0) {
      return dateCompare;
    }
    return left.seguimientoFisicoId - right.seguimientoFisicoId;
  }

  private roundNumber(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private formatMetricValue(value: number): string {
    const rounded = this.roundNumber(value);
    if (Number.isInteger(rounded)) {
      return rounded.toFixed(0);
    }
    return rounded.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  }

  private sum(values: number[]): number | null {
    if (!values.length) {
      return null;
    }
    return (
      Math.round(values.reduce((acc, value) => acc + value, 0) * 100) / 100
    );
  }

  private average(values: number[]): number | null {
    if (!values.length) {
      return null;
    }
    return (
      Math.round(
        (values.reduce((acc, value) => acc + value, 0) / values.length) * 100,
      ) / 100
    );
  }

  private toResponse(entity: Seguimientofisico): SeguimientoFisicoResponse {
    return {
      seguimientoFisicoId: entity.seguimientoFisicoId,
      pacienteId: entity.pacienteId,
      fecha: this.toIsoDate(entity.fecha),
      peso: entity.peso ?? null,
      minutosEjercicio: entity.minutosEjercicio ?? null,
      tipoEjercicio: entity.tipoEjercicio ?? null,
      intensidad: entity.intensidad ?? null,
      pasos: entity.pasos ?? null,
      caloriasQuemadas: entity.caloriasQuemadas ?? null,
      distanciaKm: entity.distanciaKm ?? null,
      notas: entity.notas ?? null,
      creadoPor: entity.creadoPor ?? null,
      creadoEn: entity.creadoEn.toISOString(),
      modificadoPor: entity.modificadoPor ?? null,
      modificadoEn: entity.modificadoEn?.toISOString() ?? null,
      campoPrueba01: entity.campoPrueba01 ?? null,
      campoPrueba02: entity.campoPrueba02 ?? null,
      campoPrueba03: entity.campoPrueba03 ?? null,
      campoPrueba04: entity.campoPrueba04 ?? null,
      campoPrueba05: entity.campoPrueba05 ?? null,
    };
  }

  private toDate(value: Date | string): Date {
    return value instanceof Date ? value : new Date(value);
  }

  private toIsoDate(value: Date | string): string {
    return this.toDate(value).toISOString().slice(0, 10);
  }
}
