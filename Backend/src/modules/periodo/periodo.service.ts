import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { Paciente } from "../paciente/paciente.entity";
import { CreatePeriodoDto } from "./dto/create-periodo.dto";
import { RegisterPeriodoSintomasDto } from "./dto/register-periodo-sintomas.dto";
import { UpdatePeriodoDto } from "./dto/update-periodo.dto";
import { Periodo } from "./periodo.entity";

/**
 * Define el tipo periodo response utilizado por el backend.
 */
type PeriodoResponse = {
  /**
   * Identificador persistido para `periodoId`.
   */
  periodoId: number;
  /**
   * Identificador persistido para `pacienteId`.
   */
  pacienteId: number;
  /**
   * Fecha asociada al campo `fechaInicio`.
   */
  fechaInicio: string;
  /**
   * Fecha asociada al campo `fechaFin`.
   */
  fechaFin: string | null;
  /**
   * Campo de datos asociado a `duracionDias`.
   */
  duracionDias: number | null;
  /**
   * Campo de datos asociado a `cicloDias`.
   */
  cicloDias: number | null;
  /**
   * Campo de datos asociado a `flujo`.
   */
  flujo: string | null;
  /**
   * Campo de datos asociado a `dolor`.
   */
  dolor: string | null;
  /**
   * Campo de datos asociado a `sintomas`.
   */
  sintomas: string[];
  /**
   * Texto descriptivo del campo `observaciones`.
   */
  observaciones: string | null;
  /**
   * Campo de datos asociado a `creadoPor`.
   */
  creadoPor: string | null;
  /**
   * Campo de datos asociado a `creadoEn`.
   */
  creadoEn: string;
  /**
   * Campo de datos asociado a `modificadoPor`.
   */
  modificadoPor: string | null;
  /**
   * Campo de datos asociado a `modificadoEn`.
   */
  modificadoEn: string | null;
  /**
   * Campo de datos asociado a `campoPrueba01`.
   */
  campoPrueba01: string | null;
  /**
   * Campo de datos asociado a `campoPrueba02`.
   */
  campoPrueba02: string | null;
  /**
   * Campo de datos asociado a `campoPrueba03`.
   */
  campoPrueba03: string | null;
  /**
   * Campo de datos asociado a `campoPrueba04`.
   */
  campoPrueba04: string | null;
  /**
   * Campo de datos asociado a `campoPrueba05`.
   */
  campoPrueba05: string | null;
};

/**
 * Define el tipo prediction event utilizado por el backend.
 */
type PredictionEvent = {
  /**
   * Campo de datos asociado a `tipo`.
   */
  tipo: "prediccion";
  /**
   * Fecha asociada al campo `fechaInicio`.
   */
  fechaInicio: string;
  /**
   * Fecha asociada al campo `fechaFin`.
   */
  fechaFin: string;
  /**
   * Campo de datos asociado a `duracionDias`.
   */
  duracionDias: number;
  /**
   * Campo de datos asociado a `cicloDias`.
   */
  cicloDias: number;
};

/**
 * Implementa la lógica de negocio y persistencia del dominio periodo.
 */
@Injectable()
export class PeriodoService {
  constructor(
    @InjectRepository(Periodo)
    private readonly periodoRepository: Repository<Periodo>,
    @InjectRepository(Paciente)
    private readonly pacienteRepository: Repository<Paciente>,
  ) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  async create(payload: CreatePeriodoDto): Promise<PeriodoResponse> {
    await this.assertPacienteFemenino(payload.pacienteId);
    const entity = this.periodoRepository.create(
      this.mapPayloadForSave(payload, true),
    );
    const saved = await this.periodoRepository.save(entity);
    return this.toResponse(saved);
  }

  /**
   * Find all.
   * @returns Colección de registros encontrados.
   */
  async findAll(): Promise<PeriodoResponse[]> {
    const femalePacienteIds = await this.findFemalePacienteIds();
    if (!femalePacienteIds.length) {
      return [];
    }
    const records = await this.periodoRepository.find({
      where: { pacienteId: In(femalePacienteIds) },
      order: { fechaInicio: "DESC", periodoId: "DESC" },
    });
    return records.map((record) => this.toResponse(record));
  }

  /**
   * Find one.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  async findOne(id: number): Promise<PeriodoResponse> {
    const entity = await this.findEntity(id);
    return this.toResponse(entity);
  }

  /**
   * Update.
   * @param id Identificador del registro objetivo.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro actualizado.
   */
  async update(
    id: number,
    payload: UpdatePeriodoDto,
  ): Promise<PeriodoResponse> {
    const entity = await this.findEntity(id);
    Object.assign(entity, this.mapPayloadForSave(payload, false));
    const saved = await this.periodoRepository.save(entity);
    return this.toResponse(saved);
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  async remove(id: number): Promise<void> {
    await this.findEntity(id);
    const result = await this.periodoRepository.delete({ periodoId: id });
    if (!result.affected) {
      throw new NotFoundException(`registro ${id} no encontrado en periodo`);
    }
  }

  /**
   * Register symptoms.
   * @param id Identificador del registro objetivo.
   * @param payload Datos validados que recibe la operación.
   * @returns Resultado de la operación.
   */
  async registerSymptoms(
    id: number,
    payload: RegisterPeriodoSintomasDto,
  ): Promise<PeriodoResponse> {
    const entity = await this.findEntity(id);
    if (payload.dolor !== undefined) {
      entity.dolor = payload.dolor;
    }
    if (payload.flujo !== undefined) {
      entity.flujo = payload.flujo;
    }
    if (payload.sintomas !== undefined) {
      entity.sintomas = this.serializeSymptoms(payload.sintomas);
    }
    if (payload.observaciones !== undefined) {
      entity.observaciones = payload.observaciones;
    }
    entity.modificadoPor = payload.modificadoPor ?? entity.modificadoPor;
    entity.modificadoEn = new Date();
    const saved = await this.periodoRepository.save(entity);
    return this.toResponse(saved);
  }

  /**
   * Get historial.
   * @param pacienteId Identificador asociado a paciente.
   * @returns Resultado de la consulta solicitada.
   */
  async getHistorial(pacienteId: number) {
    await this.assertPacienteFemenino(pacienteId);
    const records = await this.findPacienteRecords(pacienteId);
    const serialized = records
      .slice()
      .sort((a, b) => b.fechaInicio.getTime() - a.fechaInicio.getTime())
      .map((record) => this.toResponse(record));
    const duraciones = records
      .map((record) => record.duracionDias)
      .filter(
        (value): value is number => typeof value === "number" && value > 0,
      );
    const ciclos = this.calculateCycleLengths(records);

    return {
      pacienteId,
      totalRegistros: serialized.length,
      promedioDuracionDias: this.average(duraciones),
      promedioCicloDias: this.average(ciclos),
      ultimoPeriodo: serialized[0] ?? null,
      registros: serialized,
    };
  }

  /**
   * Get prediction.
   * @param pacienteId Identificador asociado a paciente.
   * @returns Resultado de la consulta solicitada.
   */
  async getPrediction(pacienteId: number) {
    await this.assertPacienteFemenino(pacienteId);
    const records = await this.findPacienteRecords(pacienteId);
    if (!records.length) {
      throw new BadRequestException(
        "no hay registros suficientes para calcular la prediccion del periodo",
      );
    }

    const prediction = this.buildPrediction(records);
    const ultimoRegistro = this.toResponse(records[records.length - 1]);

    return {
      pacienteId,
      ultimoRegistro,
      confianza: this.calculateConfidence(records.length),
      proximoPeriodo: prediction,
      ventanaFertil: {
        inicio: this.toIsoDate(
          this.addDays(new Date(prediction.fechaInicio), -19),
        ),
        fin: this.toIsoDate(
          this.addDays(new Date(prediction.fechaInicio), -13),
        ),
      },
      ovulacionEstimada: this.toIsoDate(
        this.addDays(new Date(prediction.fechaInicio), -14),
      ),
      baseCalculo: {
        registrosAnalizados: records.length,
        cicloPromedioDias: prediction.cicloDias,
        duracionPromedioDias: prediction.duracionDias,
      },
    };
  }

  /**
   * Get calendar.
   * @param pacienteId Identificador asociado a paciente.
   * @param month Valor del parámetro `month`.
   * @param year Valor del parámetro `year`.
   * @returns Resultado de la consulta solicitada.
   */
  async getCalendar(pacienteId: number, month?: number, year?: number) {
    await this.assertPacienteFemenino(pacienteId);
    const baseDate = new Date();
    const currentMonth = month ?? baseDate.getMonth() + 1;
    const currentYear = year ?? baseDate.getFullYear();

    if (currentMonth < 1 || currentMonth > 12) {
      throw new BadRequestException("el mes debe estar entre 1 y 12");
    }

    const monthStart = new Date(Date.UTC(currentYear, currentMonth - 1, 1));
    const monthEnd = new Date(Date.UTC(currentYear, currentMonth, 0));
    const records = await this.findPacienteRecords(pacienteId);

    const registros = records
      .filter((record) =>
        this.overlapsMonth(
          record.fechaInicio,
          record.fechaFin,
          monthStart,
          monthEnd,
        ),
      )
      .map((record) => ({
        tipo: "registro" as const,
        periodo: this.toResponse(record),
      }));

    const predicciones = records.length
      ? this.buildPredictionSequence(records, 6)
          .filter((event) =>
            this.overlapsMonth(
              new Date(event.fechaInicio),
              new Date(event.fechaFin),
              monthStart,
              monthEnd,
            ),
          )
          .map((event) => ({
            tipo: event.tipo,
            periodo: event,
          }))
      : [];

    return {
      pacienteId,
      mes: currentMonth,
      anio: currentYear,
      eventos: [...registros, ...predicciones].sort((a, b) =>
        a.periodo.fechaInicio.localeCompare(b.periodo.fechaInicio),
      ),
    };
  }

  /**
   * Get medical report.
   * @param pacienteId Identificador asociado a paciente.
   * @returns Resultado de la consulta solicitada.
   */
  async getMedicalReport(pacienteId: number) {
    await this.assertPacienteFemenino(pacienteId);
    const records = await this.findPacienteRecords(pacienteId);
    const historial = await this.getHistorial(pacienteId);
    const sintomasFrecuentes = this.collectTopSymptoms(records);
    const prediction = records.length ? this.buildPrediction(records) : null;
    const cycleLengths = this.calculateCycleLengths(records);
    const variance =
      cycleLengths.length > 1
        ? Math.max(...cycleLengths) - Math.min(...cycleLengths)
        : 0;
    const alertas: string[] = [];

    if (!records.length) {
      alertas.push("No existen registros clinicos del periodo.");
    }
    if (variance >= 8) {
      alertas.push(
        "Los ciclos registrados muestran variaciones amplias entre periodos.",
      );
    }
    if ((historial.promedioDuracionDias ?? 0) >= 8) {
      alertas.push(
        "La duracion promedio registrada es mayor o igual a 8 dias.",
      );
    }
    if (!alertas.length) {
      alertas.push(
        "No se detectaron patrones llamativos con los datos disponibles.",
      );
    }

    return {
      pacienteId,
      generadoEn: new Date().toISOString(),
      resumen:
        records.length > 0
          ? `Se analizaron ${records.length} registros del periodo para construir un resumen clinico orientativo.`
          : "No hay datos suficientes para construir un resumen clinico.",
      metricas: {
        totalRegistros: historial.totalRegistros,
        promedioDuracionDias: historial.promedioDuracionDias,
        promedioCicloDias: historial.promedioCicloDias,
        variacionCicloDias: variance || null,
      },
      ultimoPeriodo: historial.ultimoPeriodo,
      proximaPrediccion: prediction,
      sintomasMasFrecuentes: sintomasFrecuentes,
      alertas,
      nota: "Este reporte es un apoyo para seguimiento y no reemplaza la valoracion de un profesional de salud.",
    };
  }

  /**
   * Busca entity.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la operación.
   */
  private async findEntity(id: number): Promise<Periodo> {
    const entity = await this.periodoRepository.findOne({
      where: { periodoId: id },
    });
    if (!entity) {
      throw new NotFoundException(`registro ${id} no encontrado en periodo`);
    }
    await this.assertPacienteFemenino(entity.pacienteId);
    return entity;
  }

  /**
   * Busca paciente records.
   * @param pacienteId Identificador asociado a paciente.
   * @returns Resultado de la operación.
   */
  private async findPacienteRecords(pacienteId: number): Promise<Periodo[]> {
    return this.periodoRepository.find({
      where: { pacienteId },
      order: { fechaInicio: "ASC", periodoId: "ASC" },
    });
  }

  /**
   * Map payload for save.
   * @param payload Datos validados que recibe la operación.
   * @param isCreate Valor del parámetro `isCreate`.
   * @returns Resultado de la operación.
   */
  private mapPayloadForSave(
    payload: CreatePeriodoDto | UpdatePeriodoDto,
    isCreate: boolean,
  ): Partial<Periodo> {
    const mapped: Partial<Periodo> = {};
    if ("pacienteId" in payload && payload.pacienteId !== undefined) {
      mapped.pacienteId = payload.pacienteId;
    }
    if (payload.fechaInicio !== undefined) {
      mapped.fechaInicio = new Date(payload.fechaInicio);
    }
    if (payload.fechaFin !== undefined) {
      mapped.fechaFin = new Date(payload.fechaFin);
    }
    if (payload.duracionDias !== undefined) {
      mapped.duracionDias = payload.duracionDias;
    }
    if (payload.cicloDias !== undefined) {
      mapped.cicloDias = payload.cicloDias;
    }
    if (payload.flujo !== undefined) {
      mapped.flujo = payload.flujo;
    }
    if (payload.dolor !== undefined) {
      mapped.dolor = payload.dolor;
    }
    if (payload.sintomas !== undefined) {
      mapped.sintomas = this.serializeSymptoms(payload.sintomas);
    }
    if (payload.observaciones !== undefined) {
      mapped.observaciones = payload.observaciones;
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

    this.applyPeriodConsistency(mapped);

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

  /**
   * Valida paciente femenino.
   * @param pacienteId Identificador asociado a paciente.
   * @returns La promesa se resuelve cuando la validación se cumple.
   */
  private async assertPacienteFemenino(pacienteId: number): Promise<void> {
    const paciente = await this.pacienteRepository.findOne({
      where: { pacienteId },
    });

    if (!paciente) {
      throw new NotFoundException(`paciente ${pacienteId} no encontrado`);
    }

    const sexo = paciente.sexo?.trim().toUpperCase();
    if (sexo !== "F") {
      throw new BadRequestException(
        "el modulo de periodo solo esta disponible para pacientes de sexo femenino",
      );
    }
  }

  /**
   * Busca female paciente ids.
   * @returns Resultado de la operación.
   */
  private async findFemalePacienteIds(): Promise<number[]> {
    const pacientes = await this.pacienteRepository.find({
      select: { pacienteId: true, sexo: true },
    });

    return pacientes
      .filter((paciente) => paciente.sexo?.trim().toUpperCase() === "F")
      .map((paciente) => paciente.pacienteId);
  }

  /**
   * Apply period consistency.
   * @param payload Datos validados que recibe la operación.
   * @returns Resultado de la operación.
   */
  private applyPeriodConsistency(payload: Partial<Periodo>) {
    const start = payload.fechaInicio;
    const end = payload.fechaFin;
    const duration = payload.duracionDias;

    if (payload.cicloDias !== undefined && payload.cicloDias <= 0) {
      throw new BadRequestException("cicloDias debe ser mayor a 0");
    }
    if (duration !== undefined && duration <= 0) {
      throw new BadRequestException("duracionDias debe ser mayor a 0");
    }
    if (start && end && end.getTime() < start.getTime()) {
      throw new BadRequestException(
        "fechaFin no puede ser menor que fechaInicio",
      );
    }
    if (start && !end && duration) {
      payload.fechaFin = this.addDays(start, duration - 1);
    }
    if (start && end && duration === undefined) {
      payload.duracionDias = this.diffDays(start, end) + 1;
    }
  }

  /**
   * Construye prediction.
   * @param records Valor del parámetro `records`.
   * @returns Estructura construida para el flujo interno.
   */
  private buildPrediction(records: Periodo[]): PredictionEvent {
    const lastRecord = records[records.length - 1];
    const cycleLengths = this.calculateCycleLengths(records);
    const durations = records
      .map((record) => record.duracionDias)
      .filter(
        (value): value is number => typeof value === "number" && value > 0,
      );
    const fallbackCycle =
      lastRecord.cicloDias ?? this.average(cycleLengths) ?? 28;
    const fallbackDuration =
      this.average(durations) ?? lastRecord.duracionDias ?? 5;
    const nextStart = this.addDays(lastRecord.fechaInicio, fallbackCycle);
    const nextEnd = this.addDays(nextStart, fallbackDuration - 1);

    return {
      tipo: "prediccion",
      fechaInicio: this.toIsoDate(nextStart),
      fechaFin: this.toIsoDate(nextEnd),
      duracionDias: fallbackDuration,
      cicloDias: fallbackCycle,
    };
  }

  /**
   * Construye prediction sequence.
   * @param records Valor del parámetro `records`.
   * @param count Valor del parámetro `count`.
   * @returns Estructura construida para el flujo interno.
   */
  private buildPredictionSequence(
    records: Periodo[],
    count: number,
  ): PredictionEvent[] {
    const firstPrediction = this.buildPrediction(records);
    const result: PredictionEvent[] = [firstPrediction];

    for (let index = 1; index < count; index += 1) {
      const previous = result[index - 1];
      const nextStart = this.addDays(
        new Date(previous.fechaInicio),
        previous.cicloDias,
      );
      const nextEnd = this.addDays(nextStart, previous.duracionDias - 1);
      result.push({
        tipo: "prediccion",
        fechaInicio: this.toIsoDate(nextStart),
        fechaFin: this.toIsoDate(nextEnd),
        duracionDias: previous.duracionDias,
        cicloDias: previous.cicloDias,
      });
    }

    return result;
  }

  /**
   * Calculate cycle lengths.
   * @param records Valor del parámetro `records`.
   * @returns Resultado de la operación.
   */
  private calculateCycleLengths(records: Periodo[]): number[] {
    const values: number[] = [];
    for (let index = 1; index < records.length; index += 1) {
      const diff = this.diffDays(
        records[index - 1].fechaInicio,
        records[index].fechaInicio,
      );
      if (diff > 0) {
        values.push(diff);
      }
    }
    return values;
  }

  /**
   * Collect top symptoms.
   * @param records Valor del parámetro `records`.
   * @returns Resultado de la operación.
   */
  private collectTopSymptoms(records: Periodo[]) {
    const counts = new Map<string, number>();

    records.forEach((record) => {
      this.parseSymptoms(record.sintomas).forEach((symptom) => {
        counts.set(symptom, (counts.get(symptom) ?? 0) + 1);
      });
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 5)
      .map(([sintoma, frecuencia]) => ({ sintoma, frecuencia }));
  }

  /**
   * Calculate confidence.
   * @param recordCount Valor del parámetro `recordCount`.
   * @returns Resultado de la operación.
   */
  private calculateConfidence(recordCount: number) {
    if (recordCount >= 6) {
      return "alta";
    }
    if (recordCount >= 3) {
      return "media";
    }
    return "baja";
  }

  /**
   * Overlaps month.
   * @param start Valor del parámetro `start`.
   * @param end Valor del parámetro `end`.
   * @param monthStart Valor del parámetro `monthStart`.
   * @param monthEnd Valor del parámetro `monthEnd`.
   * @returns Resultado de la operación.
   */
  private overlapsMonth(
    start: Date,
    end: Date | undefined,
    monthStart: Date,
    monthEnd: Date,
  ) {
    const effectiveEnd = end ?? start;
    return (
      start.getTime() <= monthEnd.getTime() &&
      effectiveEnd.getTime() >= monthStart.getTime()
    );
  }

  /**
   * Average.
   * @param values Colección de valores usada por el cálculo o la validación.
   * @returns Resultado de la operación.
   */
  private average(values: number[]): number | null {
    if (!values.length) {
      return null;
    }
    const total = values.reduce((sum, value) => sum + value, 0);
    return Math.round((total / values.length) * 10) / 10;
  }

  /**
   * Diff days.
   * @param start Valor del parámetro `start`.
   * @param end Valor del parámetro `end`.
   * @returns Resultado de la operación.
   */
  private diffDays(start: Date, end: Date): number {
    const startUtc = Date.UTC(
      start.getFullYear(),
      start.getMonth(),
      start.getDate(),
    );
    const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
    return Math.round((endUtc - startUtc) / 86400000);
  }

  /**
   * Add days.
   * @param date Fecha de referencia para la operación.
   * @param days Valor del parámetro `days`.
   * @returns Resultado de la operación.
   */
  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setUTCDate(result.getUTCDate() + days);
    return result;
  }

  /**
   * Serialize symptoms.
   * @param sintomas Valor del parámetro `sintomas`.
   * @returns Resultado de la operación.
   */
  private serializeSymptoms(sintomas?: string[]): string | undefined {
    if (sintomas === undefined) {
      return undefined;
    }
    return JSON.stringify(sintomas);
  }

  /**
   * Interpreta symptoms.
   * @param sintomas Valor del parámetro `sintomas`.
   * @returns Valor interpretado a partir de la entrada recibida.
   */
  private parseSymptoms(sintomas?: string | null): string[] {
    if (!sintomas) {
      return [];
    }
    try {
      const parsed = JSON.parse(sintomas);
      return Array.isArray(parsed)
        ? parsed.filter((value): value is string => typeof value === "string")
        : [];
    } catch {
      return sintomas
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
    }
  }

  /**
   * Convierte el valor a response.
   * @param entity Valor del parámetro `entity`.
   * @returns Valor convertido al formato de salida esperado.
   */
  private toResponse(entity: Periodo): PeriodoResponse {
    return {
      periodoId: entity.periodoId,
      pacienteId: entity.pacienteId,
      fechaInicio: this.toIsoDate(entity.fechaInicio),
      fechaFin: entity.fechaFin ? this.toIsoDate(entity.fechaFin) : null,
      duracionDias: entity.duracionDias ?? null,
      cicloDias: entity.cicloDias ?? null,
      flujo: entity.flujo ?? null,
      dolor: entity.dolor ?? null,
      sintomas: this.parseSymptoms(entity.sintomas),
      observaciones: entity.observaciones ?? null,
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

  /**
   * Convierte el valor a iso date.
   * @param value Valor de entrada que se debe transformar o validar.
   * @returns Valor convertido al formato de salida esperado.
   */
  private toIsoDate(value: Date): string {
    return value.toISOString().slice(0, 10);
  }
}
