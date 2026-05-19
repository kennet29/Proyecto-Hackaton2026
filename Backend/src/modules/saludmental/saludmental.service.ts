import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Paciente } from "../paciente/paciente.entity";
import { CreateSaludmentalDto } from "./dto/create-saludmental.dto";
import { UpdateSaludmentalHabitosDto } from "./dto/update-saludmental-habitos.dto";
import { UpdateSaludmentalRegistroDiarioDto } from "./dto/update-saludmental-registro-diario.dto";
import { UpdateSaludmentalDto } from "./dto/update-saludmental.dto";
import { Saludmental } from "./saludmental.entity";

/**
 * Define el tipo saludmental response utilizado por el backend.
 */
type SaludmentalResponse = {
  /**
   * Identificador persistido para `saludmentalId`.
   */
  saludmentalId: number;
  /**
   * Identificador persistido para `pacienteId`.
   */
  pacienteId: number;
  /**
   * Fecha asociada al campo `fecha`.
   */
  fecha: string;
  /**
   * Estado actual registrado en `estadoAnimo`.
   */
  estadoAnimo: number;
  /**
   * Indicador booleano persistido en `estres`.
   */
  estres: number;
  /**
   * Campo de datos asociado a `ansiedad`.
   */
  ansiedad: number;
  /**
   * Campo de datos asociado a `horasSueno`.
   */
  horasSueno: number | null;
  /**
   * Campo de datos asociado a `notaPersonal`.
   */
  notaPersonal: string | null;
  /**
   * Campo de datos asociado a `ejercicioMinutos`.
   */
  ejercicioMinutos: number | null;
  /**
   * Campo de datos asociado a `hidratacionLitros`.
   */
  hidratacionLitros: number | null;
  /**
   * Campo de datos asociado a `descansoHoras`.
   */
  descansoHoras: number | null;
  /**
   * Campo de datos asociado a `tiempoSocialMinutos`.
   */
  tiempoSocialMinutos: number | null;
  /**
   * Campo de datos asociado a `pausasDigitales`.
   */
  pausasDigitales: number | null;
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
 * Implementa la lógica de negocio y persistencia del dominio saludmental.
 */
@Injectable()
export class SaludmentalService {
  constructor(
    @InjectRepository(Saludmental)
    private readonly saludmentalRepository: Repository<Saludmental>,
    @InjectRepository(Paciente)
    private readonly pacienteRepository: Repository<Paciente>,
  ) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  async create(payload: CreateSaludmentalDto): Promise<SaludmentalResponse> {
    await this.assertPacienteExists(payload.pacienteId);
    const entity = this.saludmentalRepository.create(
      this.mapPayloadForSave(payload, true),
    );
    const saved = await this.saludmentalRepository.save(entity);
    return this.toResponse(saved);
  }

  /**
   * Find all.
   * @returns Colección de registros encontrados.
   */
  async findAll(): Promise<SaludmentalResponse[]> {
    const records = await this.saludmentalRepository.find({
      order: { fecha: "DESC", saludmentalId: "DESC" },
    });
    return records.map((record) => this.toResponse(record));
  }

  /**
   * Find one.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  async findOne(id: number): Promise<SaludmentalResponse> {
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
    payload: UpdateSaludmentalDto,
  ): Promise<SaludmentalResponse> {
    const entity = await this.findEntity(id);
    Object.assign(entity, this.mapPayloadForSave(payload, false));
    const saved = await this.saludmentalRepository.save(entity);
    return this.toResponse(saved);
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  async remove(id: number): Promise<void> {
    await this.findEntity(id);
    const result = await this.saludmentalRepository.delete({
      saludmentalId: id,
    });
    if (!result.affected) {
      throw new NotFoundException(
        `registro ${id} no encontrado en saludmental`,
      );
    }
  }

  /**
   * Update registro diario.
   * @param id Identificador del registro objetivo.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro actualizado.
   */
  async updateRegistroDiario(
    id: number,
    payload: UpdateSaludmentalRegistroDiarioDto,
  ): Promise<SaludmentalResponse> {
    const entity = await this.findEntity(id);
    if (payload.fecha !== undefined) {
      entity.fecha = new Date(payload.fecha);
    }
    if (payload.estadoAnimo !== undefined) {
      entity.estadoAnimo = payload.estadoAnimo;
    }
    if (payload.estres !== undefined) {
      entity.estres = payload.estres;
    }
    if (payload.ansiedad !== undefined) {
      entity.ansiedad = payload.ansiedad;
    }
    if (payload.horasSueno !== undefined) {
      entity.horasSueno = payload.horasSueno;
    }
    if (payload.notaPersonal !== undefined) {
      entity.notaPersonal = payload.notaPersonal;
    }
    entity.modificadoPor = payload.modificadoPor ?? entity.modificadoPor;
    entity.modificadoEn = new Date();
    const saved = await this.saludmentalRepository.save(entity);
    return this.toResponse(saved);
  }

  /**
   * Update habitos.
   * @param id Identificador del registro objetivo.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro actualizado.
   */
  async updateHabitos(
    id: number,
    payload: UpdateSaludmentalHabitosDto,
  ): Promise<SaludmentalResponse> {
    const entity = await this.findEntity(id);
    if (payload.ejercicioMinutos !== undefined) {
      entity.ejercicioMinutos = payload.ejercicioMinutos;
    }
    if (payload.hidratacionLitros !== undefined) {
      entity.hidratacionLitros = payload.hidratacionLitros;
    }
    if (payload.descansoHoras !== undefined) {
      entity.descansoHoras = payload.descansoHoras;
    }
    if (payload.tiempoSocialMinutos !== undefined) {
      entity.tiempoSocialMinutos = payload.tiempoSocialMinutos;
    }
    if (payload.pausasDigitales !== undefined) {
      entity.pausasDigitales = payload.pausasDigitales;
    }
    entity.modificadoPor = payload.modificadoPor ?? entity.modificadoPor;
    entity.modificadoEn = new Date();
    const saved = await this.saludmentalRepository.save(entity);
    return this.toResponse(saved);
  }

  /**
   * Get historial.
   * @param pacienteId Identificador asociado a paciente.
   * @param from Valor del parámetro `from`.
   * @param to Valor del parámetro `to`.
   * @returns Resultado de la consulta solicitada.
   */
  async getHistorial(pacienteId: number, from?: string, to?: string) {
    await this.assertPacienteExists(pacienteId);
    const records = await this.findPacienteRecords(
      pacienteId,
      this.parseOptionalDate(from),
      this.parseOptionalDate(to),
    );

    return {
      pacienteId,
      totalRegistros: records.length,
      historialPorFecha: records
        .slice()
        .sort(
          (a, b) =>
            this.toDate(b.fecha).getTime() - this.toDate(a.fecha).getTime(),
        )
        .map((record) => this.toResponse(record)),
    };
  }

  /**
   * Get estadisticas.
   * @param pacienteId Identificador asociado a paciente.
   * @param from Valor del parámetro `from`.
   * @param to Valor del parámetro `to`.
   * @returns Resultado de la consulta solicitada.
   */
  async getEstadisticas(pacienteId: number, from?: string, to?: string) {
    await this.assertPacienteExists(pacienteId);
    const records = await this.findPacienteRecords(
      pacienteId,
      this.parseOptionalDate(from),
      this.parseOptionalDate(to),
    );

    return {
      pacienteId,
      promedioSemanal: this.buildWeeklyAverage(records),
      tendenciaMensual: this.buildMonthlyTrend(records),
      relacionSuenoAnimo: this.buildSleepMoodRelation(records),
    };
  }

  /**
   * Get alertas.
   * @param pacienteId Identificador asociado a paciente.
   * @returns Resultado de la consulta solicitada.
   */
  async getAlertas(pacienteId: number) {
    await this.assertPacienteExists(pacienteId);
    const records = await this.findPacienteRecords(pacienteId);
    const alerts = this.buildAlerts(records);

    return {
      pacienteId,
      totalAlertas: alerts.length,
      alertas: alerts,
    };
  }

  /**
   * Get reporte medico.
   * @param pacienteId Identificador asociado a paciente.
   * @param from Valor del parámetro `from`.
   * @param to Valor del parámetro `to`.
   * @param formato Valor del parámetro `formato`.
   * @returns Resultado de la consulta solicitada.
   */
  async getReporteMedico(
    pacienteId: number,
    from?: string,
    to?: string,
    formato = "json",
  ) {
    await this.assertPacienteExists(pacienteId);
    const fromDate = this.parseOptionalDate(from);
    const toDate = this.parseOptionalDate(to);
    const records = await this.findPacienteRecords(
      pacienteId,
      fromDate,
      toDate,
    );
    const estadisticas = {
      promedioSemanal: this.buildWeeklyAverage(records),
      tendenciaMensual: this.buildMonthlyTrend(records),
      relacionSuenoAnimo: this.buildSleepMoodRelation(records),
    };
    const alertas = this.buildAlerts(records);
    const historialPorFecha = records
      .slice()
      .sort(
        (a, b) =>
          this.toDate(b.fecha).getTime() - this.toDate(a.fecha).getTime(),
      )
      .map((record) => this.toResponse(record));

    return {
      pacienteId,
      formatoSolicitado: formato,
      generadoEn: new Date().toISOString(),
      periodo: {
        desde: fromDate ? this.toIsoDate(fromDate) : null,
        hasta: toDate ? this.toIsoDate(toDate) : null,
      },
      pdf: {
        listo: formato.toLowerCase() === "pdf",
        titulo: "Reporte medico de salud mental",
        resumen:
          records.length > 0
            ? `Se analizaron ${records.length} registros diarios de salud mental.`
            : "No hay registros disponibles para el periodo solicitado.",
        secciones: [
          "Registro diario",
          "Habitos",
          "Estadisticas",
          "Alertas",
          "Historial por fecha",
        ],
      },
      graficas: {
        promedioSemanal: estadisticas.promedioSemanal,
        tendenciaMensual: estadisticas.tendenciaMensual,
        relacionSuenoAnimo: estadisticas.relacionSuenoAnimo,
      },
      alertas,
      historialPorFecha,
    };
  }

  /**
   * Busca entity.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la operación.
   */
  private async findEntity(id: number): Promise<Saludmental> {
    const entity = await this.saludmentalRepository.findOne({
      where: { saludmentalId: id },
    });
    if (!entity) {
      throw new NotFoundException(
        `registro ${id} no encontrado en saludmental`,
      );
    }
    await this.assertPacienteExists(entity.pacienteId);
    return entity;
  }

  /**
   * Valida paciente exists.
   * @param pacienteId Identificador asociado a paciente.
   * @returns La promesa se resuelve cuando la validación se cumple.
   */
  private async assertPacienteExists(pacienteId: number): Promise<void> {
    const paciente = await this.pacienteRepository.findOne({
      where: { pacienteId },
    });
    if (!paciente) {
      throw new NotFoundException(`paciente ${pacienteId} no encontrado`);
    }
  }

  /**
   * Busca paciente records.
   * @param pacienteId Identificador asociado a paciente.
   * @param fromDate Valor del parámetro `fromDate`.
   * @param toDate Valor del parámetro `toDate`.
   * @returns Resultado de la operación.
   */
  private async findPacienteRecords(
    pacienteId: number,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<Saludmental[]> {
    const records = await this.saludmentalRepository.find({
      where: { pacienteId },
      order: { fecha: "ASC", saludmentalId: "ASC" },
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

  /**
   * Map payload for save.
   * @param payload Datos validados que recibe la operación.
   * @param isCreate Valor del parámetro `isCreate`.
   * @returns Resultado de la operación.
   */
  private mapPayloadForSave(
    payload: CreateSaludmentalDto | UpdateSaludmentalDto,
    isCreate: boolean,
  ): Partial<Saludmental> {
    const mapped: Partial<Saludmental> = {};

    if ("pacienteId" in payload && payload.pacienteId !== undefined) {
      mapped.pacienteId = payload.pacienteId;
    }
    if (payload.fecha !== undefined) {
      mapped.fecha = new Date(payload.fecha);
    }
    if (payload.estadoAnimo !== undefined) {
      mapped.estadoAnimo = payload.estadoAnimo;
    }
    if (payload.estres !== undefined) {
      mapped.estres = payload.estres;
    }
    if (payload.ansiedad !== undefined) {
      mapped.ansiedad = payload.ansiedad;
    }
    if (payload.horasSueno !== undefined) {
      mapped.horasSueno = payload.horasSueno;
    }
    if (payload.notaPersonal !== undefined) {
      mapped.notaPersonal = payload.notaPersonal;
    }
    if (payload.ejercicioMinutos !== undefined) {
      mapped.ejercicioMinutos = payload.ejercicioMinutos;
    }
    if (payload.hidratacionLitros !== undefined) {
      mapped.hidratacionLitros = payload.hidratacionLitros;
    }
    if (payload.descansoHoras !== undefined) {
      mapped.descansoHoras = payload.descansoHoras;
    }
    if (payload.tiempoSocialMinutos !== undefined) {
      mapped.tiempoSocialMinutos = payload.tiempoSocialMinutos;
    }
    if (payload.pausasDigitales !== undefined) {
      mapped.pausasDigitales = payload.pausasDigitales;
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

  /**
   * Construye weekly average.
   * @param records Valor del parámetro `records`.
   * @returns Estructura construida para el flujo interno.
   */
  private buildWeeklyAverage(records: Saludmental[]) {
    if (!records.length) {
      return {
        ventana: { desde: null, hasta: null },
        registros: 0,
        estadoAnimo: null,
        estres: null,
        ansiedad: null,
        horasSueno: null,
      };
    }

    const latestDate = this.toDate(records[records.length - 1].fecha);
    const windowStart = this.addDays(latestDate, -6);
    const weekly = records.filter(
      (record) => this.toDate(record.fecha).getTime() >= windowStart.getTime(),
    );

    return {
      ventana: {
        desde: this.toIsoDate(windowStart),
        hasta: this.toIsoDate(latestDate),
      },
      registros: weekly.length,
      estadoAnimo: this.average(weekly.map((record) => record.estadoAnimo)),
      estres: this.average(weekly.map((record) => record.estres)),
      ansiedad: this.average(weekly.map((record) => record.ansiedad)),
      horasSueno: this.average(
        weekly
          .map((record) => record.horasSueno)
          .filter((value): value is number => typeof value === "number"),
      ),
    };
  }

  /**
   * Construye monthly trend.
   * @param records Valor del parámetro `records`.
   * @returns Estructura construida para el flujo interno.
   */
  private buildMonthlyTrend(records: Saludmental[]) {
    const groups = new Map<string, Saludmental[]>();

    records.forEach((record) => {
      const key = this.toIsoDate(record.fecha).slice(0, 7);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(record);
    });

    return Array.from(groups.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([mes, items]) => ({
        mes,
        registros: items.length,
        estadoAnimoPromedio: this.average(
          items.map((item) => item.estadoAnimo),
        ),
        estresPromedio: this.average(items.map((item) => item.estres)),
        ansiedadPromedio: this.average(items.map((item) => item.ansiedad)),
        horasSuenoPromedio: this.average(
          items
            .map((item) => item.horasSueno)
            .filter((value): value is number => typeof value === "number"),
        ),
      }));
  }

  /**
   * Construye sleep mood relation.
   * @param records Valor del parámetro `records`.
   * @returns Estructura construida para el flujo interno.
   */
  private buildSleepMoodRelation(records: Saludmental[]) {
    const points = records
      .filter((record) => typeof record.horasSueno === "number")
      .map((record) => ({
        fecha: this.toIsoDate(record.fecha),
        horasSueno: record.horasSueno as number,
        estadoAnimo: record.estadoAnimo,
      }));

    return {
      puntos: points,
      correlacion: this.calculateCorrelation(
        points.map((point) => point.horasSueno),
        points.map((point) => point.estadoAnimo),
      ),
    };
  }

  /**
   * Construye alerts.
   * @param records Valor del parámetro `records`.
   * @returns Estructura construida para el flujo interno.
   */
  private buildAlerts(records: Saludmental[]) {
    if (!records.length) {
      return [];
    }

    const alerts: Array<{
      tipo: string;
      severidad: "media" | "alta";
      fecha: string;
      detalle: string;
    }> = [];

    const latest = records[records.length - 1];
    if (latest.estres >= 4) {
      alerts.push({
        tipo: "estres_alto",
        severidad: latest.estres === 5 ? "alta" : "media",
        fecha: this.toIsoDate(latest.fecha),
        detalle:
          "Se detecto un nivel de estres alto en el registro mas reciente.",
      });
    }
    if (typeof latest.horasSueno === "number" && latest.horasSueno < 6) {
      alerts.push({
        tipo: "poco_sueno",
        severidad: latest.horasSueno < 4 ? "alta" : "media",
        fecha: this.toIsoDate(latest.fecha),
        detalle:
          "Las horas de sueno del ultimo registro estan por debajo de 6.",
      });
    }
    if (records.length > 1) {
      const previous = records[records.length - 2];
      const diff = Math.abs(latest.estadoAnimo - previous.estadoAnimo);
      if (diff >= 2) {
        alerts.push({
          tipo: "cambio_fuerte_animo",
          severidad: diff >= 3 ? "alta" : "media",
          fecha: this.toIsoDate(latest.fecha),
          detalle:
            "El estado de animo cambio de forma marcada respecto al registro anterior.",
        });
      }
    }

    return alerts;
  }

  /**
   * Interpreta optional date.
   * @param value Valor de entrada que se debe transformar o validar.
   * @returns Valor interpretado a partir de la entrada recibida.
   */
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
    return Math.round((total / values.length) * 100) / 100;
  }

  /**
   * Calculate correlation.
   * @param xs Valor del parámetro `xs`.
   * @param ys Valor del parámetro `ys`.
   * @returns Resultado de la operación.
   */
  private calculateCorrelation(xs: number[], ys: number[]) {
    if (xs.length < 2 || ys.length < 2 || xs.length !== ys.length) {
      return { valor: null, lectura: "sin_datos" };
    }

    const xAvg = this.average(xs);
    const yAvg = this.average(ys);
    if (xAvg === null || yAvg === null) {
      return { valor: null, lectura: "sin_datos" };
    }

    let numerator = 0;
    let xVariance = 0;
    let yVariance = 0;

    for (let index = 0; index < xs.length; index += 1) {
      const xDelta = xs[index] - xAvg;
      const yDelta = ys[index] - yAvg;
      numerator += xDelta * yDelta;
      xVariance += xDelta * xDelta;
      yVariance += yDelta * yDelta;
    }

    if (!xVariance || !yVariance) {
      return { valor: 0, lectura: "neutral" };
    }

    const value = numerator / Math.sqrt(xVariance * yVariance);
    let lectura = "neutral";
    if (value >= 0.3) {
      lectura = "positiva";
    } else if (value <= -0.3) {
      lectura = "negativa";
    }

    return {
      valor: Math.round(value * 100) / 100,
      lectura,
    };
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
   * Convierte el valor a response.
   * @param entity Valor del parámetro `entity`.
   * @returns Valor convertido al formato de salida esperado.
   */
  private toResponse(entity: Saludmental): SaludmentalResponse {
    return {
      saludmentalId: entity.saludmentalId,
      pacienteId: entity.pacienteId,
      fecha: this.toIsoDate(entity.fecha),
      estadoAnimo: entity.estadoAnimo,
      estres: entity.estres,
      ansiedad: entity.ansiedad,
      horasSueno: entity.horasSueno ?? null,
      notaPersonal: entity.notaPersonal ?? null,
      ejercicioMinutos: entity.ejercicioMinutos ?? null,
      hidratacionLitros: entity.hidratacionLitros ?? null,
      descansoHoras: entity.descansoHoras ?? null,
      tiempoSocialMinutos: entity.tiempoSocialMinutos ?? null,
      pausasDigitales: entity.pausasDigitales ?? null,
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
   * Convierte el valor a date.
   * @param value Valor de entrada que se debe transformar o validar.
   * @returns Valor convertido al formato de salida esperado.
   */
  private toDate(value: Date | string): Date {
    return value instanceof Date ? value : new Date(value);
  }

  /**
   * Convierte el valor a iso date.
   * @param value Valor de entrada que se debe transformar o validar.
   * @returns Valor convertido al formato de salida esperado.
   */
  private toIsoDate(value: Date | string): string {
    return this.toDate(value).toISOString().slice(0, 10);
  }
}
