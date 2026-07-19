import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Not, IsNull, Repository } from "typeorm";
import { Citamedica } from "../citamedica/citamedica.entity";
import { Condicioncronica } from "../condicioncronica/condicioncronica.entity";
import { Consultamedica } from "../consultamedica/consultamedica.entity";
import { Examenclinico } from "../examenclinico/examenclinico.entity";
import { Estilovida } from "../estilovida/estilovida.entity";
import { Habitoespecifico } from "../habitoespecifico/habitoespecifico.entity";
import { Lesion } from "../lesion/lesion.entity";
import { Medicacion } from "../medicacion/medicacion.entity";
import { Operacion } from "../operacion/operacion.entity";
import { Saludmental } from "../saludmental/saludmental.entity";
import { Seguimientopostevento } from "../seguimientopostevento/seguimientopostevento.entity";
import { Seguimientofisico } from "../seguimientofisico/seguimientofisico.entity";
import { Tipocondicioncronica } from "../tipocondicioncronica/tipocondicioncronica.entity";
import { CreatePacienteDto } from "./dto/create-paciente.dto";
import { UpdatePacienteDto } from "./dto/update-paciente.dto";
import { Paciente } from "./paciente.entity";

const PRIMARY_KEYS = ["pacienteId"];
const PRIMARY_KEY_TYPES: Record<
  string,
  "number" | "string" | "boolean" | "Date"
> = {
  pacienteId: "number",
};

/**
 * Define el tipo timeline item utilizado por el backend.
 */
type TimelineItem = {
  /**
   * Campo de datos asociado a `type`.
   */
  type: string;
  /**
   * Campo de datos asociado a `title`.
   */
  title: string;
  /**
   * Campo de datos asociado a `date`.
   */
  date: string;
  /**
   * Campo de datos asociado a `detail`.
   */
  detail: string;
};

/**
 * Implementa la lógica de negocio y persistencia del dominio paciente.
 */
@Injectable()
export class PacienteService {
  constructor(
    @InjectRepository(Paciente)
    private readonly pacienteRepository: Repository<Paciente>,
    @InjectRepository(Citamedica)
    private readonly citamedicaRepository: Repository<Citamedica>,
    @InjectRepository(Consultamedica)
    private readonly consultamedicaRepository: Repository<Consultamedica>,
    @InjectRepository(Medicacion)
    private readonly medicacionRepository: Repository<Medicacion>,
    @InjectRepository(Examenclinico)
    private readonly examenclinicoRepository: Repository<Examenclinico>,
    @InjectRepository(Seguimientopostevento)
    private readonly seguimientoRepository: Repository<Seguimientopostevento>,
    @InjectRepository(Seguimientofisico)
    private readonly seguimientoFisicoRepository: Repository<Seguimientofisico>,
    @InjectRepository(Estilovida)
    private readonly estiloVidaRepository: Repository<Estilovida>,
    @InjectRepository(Habitoespecifico)
    private readonly habitoRepository: Repository<Habitoespecifico>,
    @InjectRepository(Condicioncronica)
    private readonly condicionRepository: Repository<Condicioncronica>,
    @InjectRepository(Tipocondicioncronica)
    private readonly tipoCondicionRepository: Repository<Tipocondicioncronica>,
    @InjectRepository(Lesion)
    private readonly lesionRepository: Repository<Lesion>,
    @InjectRepository(Operacion)
    private readonly operacionRepository: Repository<Operacion>,
    @InjectRepository(Saludmental)
    private readonly saludmentalRepository: Repository<Saludmental>,
  ) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  create(payload: CreatePacienteDto): Promise<Paciente> {
    const entity = this.pacienteRepository.create(payload as Partial<Paciente>);
    return this.pacienteRepository.save(entity);
  }

  /**
   * Find all.
   * @returns Colección de registros encontrados.
   */
  findAll(): Promise<Paciente[]> {
    return this.pacienteRepository.find();
  }

  /**
   * Find one.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  async findOne(id: string): Promise<Paciente> {
    const where = this.parseId(id);
    const entity = await this.pacienteRepository.findOne({ where });
    if (!entity) {
      throw new NotFoundException(`registro ${id} no encontrado en paciente`);
    }
    return entity;
  }

  /**
   * Get clinical summary.
   * @param pacienteId Identificador asociado a paciente.
   * @returns Resultado de la consulta solicitada.
   */
  async getClinicalSummary(pacienteId: number) {
    const patient = await this.pacienteRepository.findOne({
      where: { pacienteId },
    });
    if (!patient) {
      throw new NotFoundException(`paciente ${pacienteId} no encontrado`);
    }

    const [overviewRow] = await this.pacienteRepository.query(`
      SELECT TOP 1
        p.pacienteid AS pacienteId,
        p.nombres AS nombres,
        p.apellidos AS apellidos,
        p.fechanacimiento AS fechaNacimiento,
        p.telefono AS telefono,
        p.email AS email,
        p.sexo AS sexo,
        DATEDIFF(year, p.fechanacimiento, CAST(GETDATE() AS date)) AS edadAproximada,
        ISNULL(v.total_consultas, 0) AS totalConsultas,
        v.ultima_consulta AS ultimaConsulta,
        ISNULL(v.citas_pendientes, 0) AS citasPendientes,
        ISNULL(v.vacunas_aplicadas, 0) AS vacunasAplicadas,
        ISNULL(v.medicaciones_activas, 0) AS medicacionesActivas,
        ISNULL(v.recordatorios_pendientes, 0) AS recordatoriosPendientes,
        ISNULL(v.alergias_activas, 0) AS alergiasActivas,
        ISNULL(v.condiciones_activas, 0) AS condicionesActivas
      FROM paciente p
      LEFT JOIN vw_resumen_paciente v ON v.pacienteid = p.pacienteid
      WHERE p.pacienteid = ${pacienteId}
    `);

    const [examenesClinicos, seguimientosActivos, seguimientosUrgentes] =
      await Promise.all([
        this.examenclinicoRepository.count({ where: { pacienteId } }),
        this.seguimientoRepository.count({
          where: { pacienteId, estado: "activo" },
        }),
        this.seguimientoRepository.count({
          where: { pacienteId, requiereAtencion: true },
        }),
      ]);

    const [
      nextAppointment,
      activeTreatments,
      recentConsults,
      recentExams,
      recentFollowUps,
      latestPhysicalRecord,
      latestLifestyle,
      habits,
      activeConditions,
      recentInjuries,
      recentOperations,
      recentMentalHealth,
    ] = await Promise.all([
      this.citamedicaRepository.findOne({
        where: {
          pacienteId,
          estado: In(["programada", "no asistio"]),
        },
        order: { fechacita: "ASC" },
      }),
      this.medicacionRepository.find({
        where: { pacienteId, medicacionactiva: true },
        order: { fechainicio: "DESC" },
        take: 5,
      }),
      this.consultamedicaRepository.find({
        where: { pacienteId },
        order: { fechaconsulta: "DESC" },
        take: 4,
      }),
      this.examenclinicoRepository.find({
        where: { pacienteId },
        order: { fechaExamen: "DESC" },
        take: 3,
      }),
      this.seguimientoRepository.find({
        where: { pacienteId },
        order: { fechaSeguimiento: "DESC" },
        take: 4,
      }),
      this.seguimientoFisicoRepository.findOne({
        where: { pacienteId, peso: Not(IsNull()) },
        order: { fecha: "DESC" },
      }),
      this.estiloVidaRepository.findOne({
        where: { pacienteId },
        order: { fecharegistro: "DESC" },
      }),
      this.habitoRepository.find({
        where: { pacienteId },
        order: { creadoen: "DESC" },
        take: 5,
      }),
      this.condicionRepository.find({
        where: { pacienteId, estado: In(["activa", "Activa"]) },
        order: { creadoen: "DESC" },
      }),
      this.lesionRepository.find({
        where: { pacienteId },
        order: { fechalesion: "DESC" },
        take: 3,
      }),
      this.operacionRepository.find({
        where: { pacienteId },
        order: { fechaoperacion: "DESC" },
        take: 3,
      }),
      this.saludmentalRepository.find({
        where: { pacienteId },
        order: { fecha: "DESC" },
        take: 7,
      }),
    ]);

    const conditionTypeIds = [
      ...new Set(activeConditions.map((item) => item.tipocondicionId)),
    ];
    const conditionTypes = conditionTypeIds.length
      ? await this.tipoCondicionRepository.findBy({
          tipocondicionId: In(conditionTypeIds),
        })
      : [];
    const conditionNames = new Map(
      conditionTypes.map((item) => [item.tipocondicionId, item.nombre]),
    );

    const alerts = [
      overviewRow?.alergiasActivas > 0
        ? {
            level: "high",
            title: "Alergias activas",
            detail: `Hay ${overviewRow.alergiasActivas} alergias activas registradas.`,
          }
        : null,
      overviewRow?.condicionesActivas > 0
        ? {
            level: "medium",
            title: "Condiciones cronicas activas",
            detail: `Existen ${overviewRow.condicionesActivas} condiciones que requieren seguimiento.`,
          }
        : null,
      nextAppointment
        ? {
            level: "info",
            title: "Proxima cita programada",
            detail: `${nextAppointment.especialidad ?? "Consulta general"} el ${this.toIsoString(
              nextAppointment.fechacita,
            )}`,
          }
        : null,
      seguimientosUrgentes > 0
        ? {
            level: "high",
            title: "Seguimientos que requieren atencion",
            detail: `Hay ${seguimientosUrgentes} seguimientos marcados para revisar.`,
          }
        : null,
      overviewRow?.recordatoriosPendientes > 0
        ? {
            level: "info",
            title: "Recordatorios pendientes",
            detail: `Tienes ${overviewRow.recordatoriosPendientes} recordatorios clinicos por enviar o confirmar.`,
          }
        : null,
    ].filter(Boolean);

    const recentTimeline = this.buildTimeline(
      recentConsults,
      recentExams,
      recentFollowUps,
      nextAppointment,
    );

    const carePointers = [
      !overviewRow?.totalConsultas
        ? "Aun no hay consultas registradas. Conviene documentar la primera evaluacion medica."
        : null,
      overviewRow?.medicacionesActivas > 0
        ? "Revisa adherencia y fechas de fin de tratamientos activos."
        : null,
      nextAppointment
        ? "Mantén visible la proxima cita para reducir ausencias y reprogramaciones."
        : null,
      seguimientosUrgentes > 0
        ? "Prioriza los seguimientos marcados con requiereAtencion."
        : null,
      !examenesClinicos
        ? "No hay examenes clinicos registrados. Puede faltar evidencia complementaria del caso."
        : null,
    ].filter(Boolean);

    return {
      generatedAt: new Date().toISOString(),
      patient: {
        pacienteId: patient.pacienteId,
        nombres: patient.nombres,
        apellidos: patient.apellidos,
        telefono: patient.telefono ?? null,
        email: patient.email ?? null,
        sexo: patient.sexo ?? null,
        fechaNacimiento: patient.fechanacimiento
          ? this.toIsoDate(patient.fechanacimiento)
          : null,
        edadAproximada: overviewRow?.edadAproximada ?? null,
      },
      overview: {
        totalConsultas: overviewRow?.totalConsultas ?? 0,
        ultimaConsulta: overviewRow?.ultimaConsulta
          ? this.toIsoString(overviewRow.ultimaConsulta)
          : null,
        citasPendientes: overviewRow?.citasPendientes ?? 0,
        vacunasAplicadas: overviewRow?.vacunasAplicadas ?? 0,
        medicacionesActivas: overviewRow?.medicacionesActivas ?? 0,
        recordatoriosPendientes: overviewRow?.recordatoriosPendientes ?? 0,
        alergiasActivas: overviewRow?.alergiasActivas ?? 0,
        condicionesActivas: overviewRow?.condicionesActivas ?? 0,
        examenesClinicos,
        seguimientosActivos,
      },
      alerts,
      activeTreatments: activeTreatments.map((item) => ({
        medicacionId: item.medicacionId,
        nombre: item.nombremedicamento,
        dosis: item.dosis ?? null,
        viaAdministracion: item.viaadministracion ?? null,
        fechaInicio: this.toIsoDate(item.fechainicio),
        fechaFin: item.fechafin ? this.toIsoDate(item.fechafin) : null,
        indicaciones: item.indicaciones ?? null,
      })),
      upcoming: {
        nextAppointment: nextAppointment
          ? {
              citaId: nextAppointment.citaId,
              fecha: this.toIsoString(nextAppointment.fechacita),
              especialidad: nextAppointment.especialidad ?? null,
              motivo: nextAppointment.motivo ?? null,
              estado: nextAppointment.estado,
            }
          : null,
        nextFollowUp: recentFollowUps.find((item) => item.proximoControl)
          ?.proximoControl
          ? this.toIsoDate(
              recentFollowUps.find((item) => item.proximoControl)!
                .proximoControl as Date,
            )
          : null,
      },
      clinicalDetails: {
        latestWeight:
          latestPhysicalRecord?.peso !== null &&
          latestPhysicalRecord?.peso !== undefined
            ? {
                value: Number(latestPhysicalRecord.peso),
                date: this.toIsoDate(latestPhysicalRecord.fecha),
              }
            : null,
        lifestyle: latestLifestyle
          ? {
              date: this.toIsoDate(latestLifestyle.fecharegistro),
              alimentacion: latestLifestyle.alimentacion ?? null,
              actividadFisica: latestLifestyle.actividadfisica ?? null,
              consumoAlcohol: latestLifestyle.consumoalcohol ?? null,
              consumoTabaco: latestLifestyle.consumotabaco ?? null,
              horasSueno:
                latestLifestyle.horassueno !== undefined
                  ? Number(latestLifestyle.horassueno)
                  : null,
              estres: latestLifestyle.estres ?? null,
            }
          : null,
        habits: habits.map((item) => ({
          habitoId: item.habitoId,
          categoria: item.categoria ?? null,
          nivel: item.nivel ?? null,
          frecuencia: item.frecuencia ?? null,
          cantidad:
            item.cantidad !== undefined ? Number(item.cantidad) : null,
          unidad: item.unidad ?? null,
          impactoSalud: item.impactosalud ?? null,
        })),
        activeConditions: activeConditions.map((item) => ({
          condicionId: item.condicioncronicaId,
          nombre:
            conditionNames.get(item.tipocondicionId) ??
            `Condición #${item.tipocondicionId}`,
          severidad: item.severidad ?? null,
          tratamiento: item.tratamientoprincipal ?? null,
          fechaDiagnostico: item.fechadiagnostico
            ? this.toIsoDate(item.fechadiagnostico)
            : null,
        })),
        recentInjuries: recentInjuries.map((item) => ({
          lesionId: item.lesionId,
          tipo: item.tipo,
          parteCuerpo: item.partecuerpo ?? null,
          severidad: item.severidad ?? null,
          recuperado: item.recuperado,
          fecha: this.toIsoDate(item.fechalesion),
        })),
        recentOperations: recentOperations.map((item) => ({
          operacionId: item.operacionId,
          tipo: item.tipo,
          estado: item.estado,
          hospital: item.hospital ?? null,
          fecha: this.toIsoDate(item.fechaoperacion),
        })),
        mentalHealth: recentMentalHealth.length
          ? {
              latest: {
                date: this.toIsoDate(recentMentalHealth[0].fecha),
                mood: recentMentalHealth[0].estadoAnimo,
                stress: recentMentalHealth[0].estres,
                anxiety: recentMentalHealth[0].ansiedad,
                sleepHours:
                  recentMentalHealth[0].horasSueno !== null &&
                  recentMentalHealth[0].horasSueno !== undefined
                    ? Number(recentMentalHealth[0].horasSueno)
                    : null,
              },
              recentRecords: recentMentalHealth.length,
              averageMood: this.average(
                recentMentalHealth.map((item) => item.estadoAnimo),
              ),
              averageStress: this.average(
                recentMentalHealth.map((item) => item.estres),
              ),
              averageAnxiety: this.average(
                recentMentalHealth.map((item) => item.ansiedad),
              ),
            }
          : null,
      },
      recentTimeline,
      carePointers,
    };
  }

  /**
   * Update.
   * @param id Identificador del registro objetivo.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro actualizado.
   */
  async update(id: string, payload: UpdatePacienteDto): Promise<Paciente> {
    const entity = await this.findOne(id);
    Object.assign(entity, payload);
    return this.pacienteRepository.save(entity);
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  async remove(id: string): Promise<void> {
    const where = this.parseId(id);
    const result = await this.pacienteRepository.delete(where);
    if (!result.affected) {
      throw new NotFoundException(`registro ${id} no encontrado en paciente`);
    }
  }

  /**
   * Construye timeline.
   * @param recentConsults Valor del parámetro `recentConsults`.
   * @param recentExams Valor del parámetro `recentExams`.
   * @param recentFollowUps Valor del parámetro `recentFollowUps`.
   * @param nextAppointment Valor del parámetro `nextAppointment`.
   * @returns Estructura construida para el flujo interno.
   */
  private buildTimeline(
    recentConsults: Consultamedica[],
    recentExams: Examenclinico[],
    recentFollowUps: Seguimientopostevento[],
    nextAppointment: Citamedica | null,
  ): TimelineItem[] {
    const items: TimelineItem[] = [
      ...recentConsults.map((item) => ({
        type: "Consulta",
        title: item.motivo || "Consulta medica",
        date: this.toIsoString(item.fechaconsulta),
        detail:
          item.diagnostico || item.tratamiento || item.estado || "Sin detalle",
      })),
      ...recentExams.map((item) => ({
        type: "Examen",
        title: item.nombreExamen,
        date: this.toIsoDate(item.fechaExamen),
        detail:
          item.resultadoTexto ||
          item.observaciones ||
          item.laboratorio ||
          "Sin detalle",
      })),
      ...recentFollowUps.map((item) => ({
        type: "Seguimiento",
        title: item.tituloEvento,
        date: this.toIsoString(item.fechaSeguimiento),
        detail: item.estado || item.evolucion || item.notas || "Sin detalle",
      })),
    ];

    if (nextAppointment) {
      items.push({
        type: "Proxima cita",
        title: nextAppointment.especialidad || "Cita medica",
        date: this.toIsoString(nextAppointment.fechacita),
        detail:
          nextAppointment.motivo || nextAppointment.estado || "Sin detalle",
      });
    }

    return items
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8);
  }

  /**
   * Interpreta id.
   * @param rawId Identificador asociado a raw.
   * @returns Valor interpretado a partir de la entrada recibida.
   */
  private parseId(rawId: string): Record<string, any> {
    if (!PRIMARY_KEYS.length) {
      throw new BadRequestException("la tabla no define una clave primaria");
    }
    if (PRIMARY_KEYS.length === 1) {
      const key = PRIMARY_KEYS[0];
      return { [key]: this.castValue(rawId, PRIMARY_KEY_TYPES[key]) };
    }
    const segments = rawId.split(",").map((segment) => segment.trim());
    if (segments.length !== PRIMARY_KEYS.length) {
      throw new BadRequestException(
        "usa valores separados por coma siguiendo el orden de la clave primaria",
      );
    }
    const where: Record<string, any> = {};
    segments.forEach((segment, index) => {
      const key = PRIMARY_KEYS[index];
      where[key] = this.castValue(segment, PRIMARY_KEY_TYPES[key]);
    });
    return where;
  }

  /**
   * Cast value.
   * @param value Valor de entrada que se debe transformar o validar.
   * @param type Valor del parámetro `type`.
   * @returns Resultado de la operación.
   */
  private castValue(value: string, type: string): any {
    if (type === "number") {
      const num = Number(value);
      if (Number.isNaN(num)) {
        throw new BadRequestException("el identificador debe ser numerico");
      }
      return num;
    }
    if (type === "boolean") {
      if (value === "1" || value.toLowerCase() === "true") {
        return true;
      }
      if (value === "0" || value.toLowerCase() === "false") {
        return false;
      }
      throw new BadRequestException("el identificador booleano es invalido");
    }
    if (type === "Date") {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        throw new BadRequestException("el identificador de fecha es invalido");
      }
      return date;
    }
    return value;
  }

  /**
   * Convierte el valor a iso date.
   * @param value Valor de entrada que se debe transformar o validar.
   * @returns Valor convertido al formato de salida esperado.
   */
  private toIsoDate(value: Date | string): string {
    const date = value instanceof Date ? value : new Date(value);
    return date.toISOString().slice(0, 10);
  }

  /**
   * Calcula un promedio con una cifra decimal.
   */
  private average(values: number[]): number {
    const total = values.reduce((sum, value) => sum + Number(value), 0);
    return Math.round((total / values.length) * 10) / 10;
  }

  /**
   * Convierte el valor a iso string.
   * @param value Valor de entrada que se debe transformar o validar.
   * @returns Valor convertido al formato de salida esperado.
   */
  private toIsoString(value: Date | string): string {
    const date = value instanceof Date ? value : new Date(value);
    return date.toISOString();
  }
}
