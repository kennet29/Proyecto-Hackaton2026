import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Lesion } from "../lesion/lesion.entity";
import { Operacion } from "../operacion/operacion.entity";
import { Paciente } from "../paciente/paciente.entity";
import { CreateSeguimientoposteventoDto } from "./dto/create-seguimientopostevento.dto";
import { UpdateSeguimientoposteventoDto } from "./dto/update-seguimientopostevento.dto";
import { Seguimientopostevento } from "./seguimientopostevento.entity";

/**
 * Define el tipo seguimiento postevento response utilizado por el backend.
 */
type SeguimientoPosteventoResponse = {
  /**
   * Identificador persistido para `seguimientoPosteventoId`.
   */
  seguimientoPosteventoId: number;
  /**
   * Identificador persistido para `pacienteId`.
   */
  pacienteId: number;
  /**
   * Campo de datos asociado a `tipoEvento`.
   */
  tipoEvento: string;
  /**
   * Identificador persistido para `operacionId`.
   */
  operacionId: number | null;
  /**
   * Identificador persistido para `lesionId`.
   */
  lesionId: number | null;
  /**
   * Nombre descriptivo almacenado en `tituloEvento`.
   */
  tituloEvento: string;
  /**
   * Fecha asociada al campo `fechaEvento`.
   */
  fechaEvento: string;
  /**
   * Fecha asociada al campo `fechaSeguimiento`.
   */
  fechaSeguimiento: string;
  /**
   * Estado actual registrado en `estado`.
   */
  estado: string;
  /**
   * Campo de datos asociado a `evolucion`.
   */
  evolucion: string | null;
  /**
   * Campo de datos asociado a `sintomas`.
   */
  sintomas: string | null;
  /**
   * Campo de datos asociado a `nivelDolor`.
   */
  nivelDolor: number | null;
  /**
   * Campo de datos asociado a `medicacionActual`.
   */
  medicacionActual: string | null;
  /**
   * Campo de datos asociado a `cuidadosHogar`.
   */
  cuidadosHogar: string | null;
  /**
   * Campo de datos asociado a `notas`.
   */
  notas: string | null;
  /**
   * Campo de datos asociado a `compartirConMedico`.
   */
  compartirConMedico: boolean;
  /**
   * Indicador booleano persistido en `requiereAtencion`.
   */
  requiereAtencion: boolean;
  /**
   * Campo de datos asociado a `proximoControl`.
   */
  proximoControl: string | null;
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
 * Implementa la lógica de negocio y persistencia del dominio seguimientopostevento.
 */
@Injectable()
export class SeguimientoposteventoService {
  constructor(
    @InjectRepository(Seguimientopostevento)
    private readonly seguimientoRepository: Repository<Seguimientopostevento>,
    @InjectRepository(Paciente)
    private readonly pacienteRepository: Repository<Paciente>,
    @InjectRepository(Operacion)
    private readonly operacionRepository: Repository<Operacion>,
    @InjectRepository(Lesion)
    private readonly lesionRepository: Repository<Lesion>,
  ) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  async create(
    payload: CreateSeguimientoposteventoDto,
  ): Promise<SeguimientoPosteventoResponse> {
    await this.assertPacienteExists(payload.pacienteId);
    await this.assertEventConsistency(
      payload.pacienteId,
      payload.tipoEvento,
      payload.operacionId,
      payload.lesionId,
    );
    const entity = this.seguimientoRepository.create(
      this.mapPayloadForSave(payload, true),
    );
    const saved = await this.seguimientoRepository.save(entity);
    return this.toResponse(saved);
  }

  /**
   * Find all.
   * @param pacienteId Identificador asociado a paciente.
   * @param tipoEvento Valor del parámetro `tipoEvento`.
   * @param compartidos Valor del parámetro `compartidos`.
   * @returns Colección de registros encontrados.
   */
  async findAll(
    pacienteId?: number,
    tipoEvento?: string,
    compartidos?: boolean,
  ): Promise<SeguimientoPosteventoResponse[]> {
    const records = await this.findRecords(pacienteId, tipoEvento, compartidos);
    return records.map((record) => this.toResponse(record));
  }

  /**
   * Find one.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  async findOne(id: number): Promise<SeguimientoPosteventoResponse> {
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
    payload: UpdateSeguimientoposteventoDto,
  ): Promise<SeguimientoPosteventoResponse> {
    const entity = await this.findEntity(id);
    const nextPacienteId = payload.pacienteId ?? entity.pacienteId;
    const nextTipoEvento = payload.tipoEvento ?? entity.tipoEvento;
    const nextOperacionId =
      payload.operacionId === undefined
        ? entity.operacionId
        : payload.operacionId;
    const nextLesionId =
      payload.lesionId === undefined ? entity.lesionId : payload.lesionId;

    await this.assertPacienteExists(nextPacienteId);
    await this.assertEventConsistency(
      nextPacienteId,
      nextTipoEvento,
      nextOperacionId,
      nextLesionId,
    );

    Object.assign(entity, this.mapPayloadForSave(payload, false));
    const saved = await this.seguimientoRepository.save(entity);
    return this.toResponse(saved);
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  async remove(id: number): Promise<void> {
    await this.findEntity(id);
    const result = await this.seguimientoRepository.delete({
      seguimientoPosteventoId: id,
    });
    if (!result.affected) {
      throw new NotFoundException(
        `registro ${id} no encontrado en seguimientopostevento`,
      );
    }
  }

  /**
   * Get historial.
   * @param pacienteId Identificador asociado a paciente.
   * @param tipoEvento Valor del parámetro `tipoEvento`.
   * @returns Resultado de la consulta solicitada.
   */
  async getHistorial(pacienteId: number, tipoEvento?: string) {
    await this.assertPacienteExists(pacienteId);
    const registros = await this.findRecords(pacienteId, tipoEvento);
    return {
      pacienteId,
      tipoEvento: tipoEvento ?? null,
      totalRegistros: registros.length,
      registros: registros.map((record) => this.toResponse(record)),
    };
  }

  /**
   * Get compartidos con medico.
   * @param pacienteId Identificador asociado a paciente.
   * @returns Resultado de la consulta solicitada.
   */
  async getCompartidosConMedico(pacienteId: number) {
    await this.assertPacienteExists(pacienteId);
    const registros = await this.findRecords(pacienteId, undefined, true);
    return {
      pacienteId,
      totalCompartidos: registros.length,
      registros: registros.map((record) => this.toResponse(record)),
    };
  }

  /**
   * Busca entity.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la operación.
   */
  private async findEntity(id: number): Promise<Seguimientopostevento> {
    const entity = await this.seguimientoRepository.findOne({
      where: { seguimientoPosteventoId: id },
    });
    if (!entity) {
      throw new NotFoundException(
        `registro ${id} no encontrado en seguimientopostevento`,
      );
    }
    return entity;
  }

  /**
   * Busca records.
   * @param pacienteId Identificador asociado a paciente.
   * @param tipoEvento Valor del parámetro `tipoEvento`.
   * @param compartidos Valor del parámetro `compartidos`.
   * @returns Resultado de la operación.
   */
  private async findRecords(
    pacienteId?: number,
    tipoEvento?: string,
    compartidos?: boolean,
  ): Promise<Seguimientopostevento[]> {
    if (pacienteId !== undefined) {
      await this.assertPacienteExists(pacienteId);
    }

    const records = await this.seguimientoRepository.find({
      where: pacienteId !== undefined ? { pacienteId } : {},
      order: { fechaSeguimiento: "DESC", seguimientoPosteventoId: "DESC" },
    });

    return records.filter((record) => {
      if (tipoEvento && record.tipoEvento !== tipoEvento) {
        return false;
      }
      if (
        compartidos !== undefined &&
        record.compartirConMedico !== compartidos
      ) {
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
    payload: CreateSeguimientoposteventoDto | UpdateSeguimientoposteventoDto,
    isCreate: boolean,
  ): Partial<Seguimientopostevento> {
    const mapped: Partial<Seguimientopostevento> = {};

    if ("pacienteId" in payload && payload.pacienteId !== undefined) {
      mapped.pacienteId = payload.pacienteId;
    }
    if (payload.tipoEvento !== undefined) {
      mapped.tipoEvento = payload.tipoEvento;
    }
    if (payload.operacionId !== undefined) {
      mapped.operacionId = payload.operacionId ?? null;
    }
    if (payload.lesionId !== undefined) {
      mapped.lesionId = payload.lesionId ?? null;
    }
    if (payload.tituloEvento !== undefined) {
      mapped.tituloEvento = payload.tituloEvento;
    }
    if (payload.fechaEvento !== undefined) {
      mapped.fechaEvento = new Date(payload.fechaEvento);
    }
    if (payload.fechaSeguimiento !== undefined) {
      mapped.fechaSeguimiento = new Date(payload.fechaSeguimiento);
    }
    if (payload.estado !== undefined) {
      mapped.estado = payload.estado;
    }
    if (payload.evolucion !== undefined) {
      mapped.evolucion = payload.evolucion;
    }
    if (payload.sintomas !== undefined) {
      mapped.sintomas = payload.sintomas;
    }
    if (payload.nivelDolor !== undefined) {
      mapped.nivelDolor = payload.nivelDolor;
    }
    if (payload.medicacionActual !== undefined) {
      mapped.medicacionActual = payload.medicacionActual;
    }
    if (payload.cuidadosHogar !== undefined) {
      mapped.cuidadosHogar = payload.cuidadosHogar;
    }
    if (payload.notas !== undefined) {
      mapped.notas = payload.notas;
    }
    if (payload.compartirConMedico !== undefined) {
      mapped.compartirConMedico = payload.compartirConMedico;
    } else if (isCreate) {
      mapped.compartirConMedico = true;
    }
    if (payload.requiereAtencion !== undefined) {
      mapped.requiereAtencion = payload.requiereAtencion;
    } else if (isCreate) {
      mapped.requiereAtencion = false;
    }
    if (payload.proximoControl !== undefined) {
      mapped.proximoControl = payload.proximoControl
        ? new Date(payload.proximoControl)
        : null;
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
      if (mapped.fechaSeguimiento === undefined) {
        mapped.fechaSeguimiento = new Date();
      }
      if (mapped.estado === undefined) {
        mapped.estado = "activo";
      }
    } else {
      mapped.modificadoEn =
        "modificadoEn" in payload && payload.modificadoEn
          ? new Date(payload.modificadoEn)
          : new Date();
    }

    return mapped;
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
   * Valida event consistency.
   * @param pacienteId Identificador asociado a paciente.
   * @param tipoEvento Valor del parámetro `tipoEvento`.
   * @param operacionId Identificador asociado a operacion.
   * @param lesionId Identificador asociado a lesion.
   * @returns La promesa se resuelve cuando la validación se cumple.
   */
  private async assertEventConsistency(
    pacienteId: number,
    tipoEvento: string,
    operacionId?: number | null,
    lesionId?: number | null,
  ): Promise<void> {
    if (tipoEvento === "operacion") {
      if (!operacionId) {
        throw new BadRequestException(
          "para seguimiento de operacion debes enviar operacionId",
        );
      }
      if (lesionId) {
        throw new BadRequestException(
          "no combines lesionId con un seguimiento de operacion",
        );
      }
      const operacion = await this.operacionRepository.findOne({
        where: { operacionId },
      });
      if (!operacion || operacion.pacienteId !== pacienteId) {
        throw new BadRequestException(
          "la operacion indicada no existe o no pertenece al paciente",
        );
      }
      return;
    }

    if (tipoEvento === "lesion") {
      if (!lesionId) {
        throw new BadRequestException(
          "para seguimiento de lesion debes enviar lesionId",
        );
      }
      if (operacionId) {
        throw new BadRequestException(
          "no combines operacionId con un seguimiento de lesion",
        );
      }
      const lesion = await this.lesionRepository.findOne({
        where: { lesionId },
      });
      if (!lesion || lesion.pacienteId !== pacienteId) {
        throw new BadRequestException(
          "la lesion indicada no existe o no pertenece al paciente",
        );
      }
      return;
    }

    if (tipoEvento === "emergencia") {
      if (operacionId || lesionId) {
        throw new BadRequestException(
          "no uses operacionId o lesionId cuando el tipoEvento es emergencia",
        );
      }
      return;
    }

    throw new BadRequestException("tipoEvento no soportado");
  }

  /**
   * Convierte el valor a response.
   * @param entity Valor del parámetro `entity`.
   * @returns Valor convertido al formato de salida esperado.
   */
  private toResponse(
    entity: Seguimientopostevento,
  ): SeguimientoPosteventoResponse {
    return {
      seguimientoPosteventoId: entity.seguimientoPosteventoId,
      pacienteId: entity.pacienteId,
      tipoEvento: entity.tipoEvento,
      operacionId: entity.operacionId ?? null,
      lesionId: entity.lesionId ?? null,
      tituloEvento: entity.tituloEvento,
      fechaEvento: this.toIsoDate(entity.fechaEvento),
      fechaSeguimiento: this.toIsoString(entity.fechaSeguimiento),
      estado: entity.estado,
      evolucion: entity.evolucion ?? null,
      sintomas: entity.sintomas ?? null,
      nivelDolor: entity.nivelDolor ?? null,
      medicacionActual: entity.medicacionActual ?? null,
      cuidadosHogar: entity.cuidadosHogar ?? null,
      notas: entity.notas ?? null,
      compartirConMedico: entity.compartirConMedico,
      requiereAtencion: entity.requiereAtencion,
      proximoControl: entity.proximoControl
        ? this.toIsoDate(entity.proximoControl)
        : null,
      creadoPor: entity.creadoPor ?? null,
      creadoEn: this.toIsoString(entity.creadoEn),
      modificadoPor: entity.modificadoPor ?? null,
      modificadoEn: entity.modificadoEn
        ? this.toIsoString(entity.modificadoEn)
        : null,
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

  /**
   * Convierte el valor a iso string.
   * @param value Valor de entrada que se debe transformar o validar.
   * @returns Valor convertido al formato de salida esperado.
   */
  private toIsoString(value: Date | string): string {
    return this.toDate(value).toISOString();
  }
}
