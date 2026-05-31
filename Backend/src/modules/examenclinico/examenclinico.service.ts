import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  CreateExamenclinicoDto,
  UpdateExamenclinicoDto,
} from "./dto/create-examenclinico.dto";
import { Examenclinico } from "./examenclinico.entity";

/**
 * Implementa la lógica de negocio y persistencia del dominio examenclinico.
 */
@Injectable()
export class ExamenclinicoService {
  constructor(
    @InjectRepository(Examenclinico)
    private readonly examenclinicoRepository: Repository<Examenclinico>,
  ) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  async create(payload: CreateExamenclinicoDto) {
    const entity = this.examenclinicoRepository.create();
    entity.pacienteId = payload.pacienteId;
    entity.consultaId = payload.consultaId ?? null;
    entity.nombreExamen = payload.nombreExamen;
    entity.tipoExamen = payload.tipoExamen ?? null;
    entity.laboratorio = payload.laboratorio ?? null;
    entity.fechaExamen = payload.fechaExamen;
    entity.fechaResultado = payload.fechaResultado ?? null;
    entity.resultadoTexto = payload.resultadoTexto ?? null;
    entity.observaciones = payload.observaciones ?? null;
    entity.archivoPdf =
      this.decodePdf(payload.archivoPdfBase64, "archivoPdfBase64") ?? null;
    entity.nombreArchivoPdf = entity.archivoPdf
      ? this.normalizeFileName(payload.nombreArchivoPdf)
      : null;
    entity.mimeArchivoPdf = entity.archivoPdf ? "application/pdf" : null;
    entity.creadoPor = payload.creadoPor ?? null;
    entity.creadoEn = payload.creadoEn ?? new Date();
    entity.modificadoPor = payload.modificadoPor ?? null;
    entity.modificadoEn = payload.modificadoEn ?? null;
    entity.campoPrueba01 = payload.campoPrueba01 ?? null;
    entity.campoPrueba02 = payload.campoPrueba02 ?? null;
    entity.campoPrueba03 = payload.campoPrueba03 ?? null;
    entity.campoPrueba04 = payload.campoPrueba04 ?? null;
    entity.campoPrueba05 = payload.campoPrueba05 ?? null;
    const saved = await this.examenclinicoRepository.save(entity);
    return this.toResponse(saved);
  }

  /**
   * Find all.
   * @param pacienteId Identificador asociado a paciente.
   * @returns Colección de registros encontrados.
   */
  async findAll(pacienteId?: number) {
    const items = await this.examenclinicoRepository.find({
      where: pacienteId ? { pacienteId } : {},
      order: { fechaExamen: "DESC", examenclinicoId: "DESC" },
    });
    return items.map((item) => this.toResponse(item));
  }

  /**
   * Find one.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  async findOne(id: number) {
    const entity = await this.examenclinicoRepository.findOne({
      where: { examenclinicoId: id },
    });
    if (!entity) {
      throw new NotFoundException(
        `registro ${id} no encontrado en examenclinico`,
      );
    }
    return this.toResponse(entity);
  }

  /**
   * Update.
   * @param id Identificador del registro objetivo.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro actualizado.
   */
  async update(id: number, payload: UpdateExamenclinicoDto) {
    const entity = await this.examenclinicoRepository.findOne({
      where: { examenclinicoId: id },
    });
    if (!entity) {
      throw new NotFoundException(
        `registro ${id} no encontrado en examenclinico`,
      );
    }

    if (payload.pacienteId !== undefined) {
      entity.pacienteId = payload.pacienteId;
    }
    if (payload.consultaId !== undefined) {
      entity.consultaId = payload.consultaId ?? null;
    }
    if (payload.nombreExamen !== undefined) {
      entity.nombreExamen = payload.nombreExamen;
    }
    if (payload.tipoExamen !== undefined) {
      entity.tipoExamen = payload.tipoExamen ?? null;
    }
    if (payload.laboratorio !== undefined) {
      entity.laboratorio = payload.laboratorio ?? null;
    }
    if (payload.fechaExamen !== undefined) {
      entity.fechaExamen = payload.fechaExamen;
    }
    if (payload.fechaResultado !== undefined) {
      entity.fechaResultado = payload.fechaResultado ?? null;
    }
    if (payload.resultadoTexto !== undefined) {
      entity.resultadoTexto = payload.resultadoTexto ?? null;
    }
    if (payload.observaciones !== undefined) {
      entity.observaciones = payload.observaciones ?? null;
    }
    if (payload.archivoPdfBase64 !== undefined) {
      entity.archivoPdf =
        this.decodePdf(payload.archivoPdfBase64, "archivoPdfBase64") ?? null;
      entity.mimeArchivoPdf = entity.archivoPdf ? "application/pdf" : null;
      if (!entity.archivoPdf) {
        entity.nombreArchivoPdf = null;
      }
    }
    if (payload.nombreArchivoPdf !== undefined) {
      entity.nombreArchivoPdf = entity.mimeArchivoPdf
        ? this.normalizeFileName(payload.nombreArchivoPdf)
        : null;
    }
    if (payload.creadoPor !== undefined) {
      entity.creadoPor = payload.creadoPor ?? null;
    }
    if (payload.creadoEn !== undefined) {
      entity.creadoEn = payload.creadoEn;
    }
    if (payload.modificadoPor !== undefined) {
      entity.modificadoPor = payload.modificadoPor ?? null;
    }
    entity.modificadoEn = payload.modificadoEn ?? new Date();
    if (payload.campoPrueba01 !== undefined) {
      entity.campoPrueba01 = payload.campoPrueba01 ?? null;
    }
    if (payload.campoPrueba02 !== undefined) {
      entity.campoPrueba02 = payload.campoPrueba02 ?? null;
    }
    if (payload.campoPrueba03 !== undefined) {
      entity.campoPrueba03 = payload.campoPrueba03 ?? null;
    }
    if (payload.campoPrueba04 !== undefined) {
      entity.campoPrueba04 = payload.campoPrueba04 ?? null;
    }
    if (payload.campoPrueba05 !== undefined) {
      entity.campoPrueba05 = payload.campoPrueba05 ?? null;
    }

    const saved = await this.examenclinicoRepository.save(entity);
    return this.toResponse(saved);
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  async remove(id: number) {
    const result = await this.examenclinicoRepository.delete({
      examenclinicoId: id,
    });
    if (!result.affected) {
      throw new NotFoundException(
        `registro ${id} no encontrado en examenclinico`,
      );
    }
    return { deleted: true, examenclinicoId: id };
  }

  /**
   * Get documento.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  async getDocumento(id: number) {
    const entity = await this.examenclinicoRepository
      .createQueryBuilder("examen")
      .addSelect("examen.archivoPdf")
      .where("examen.examenclinicoid = :id", { id })
      .getOne();

    if (!entity) {
      throw new NotFoundException(
        `registro ${id} no encontrado en examenclinico`,
      );
    }
    if (!entity.archivoPdf) {
      throw new NotFoundException(
        `el examen ${id} no tiene documento pdf adjunto`,
      );
    }

    return {
      examenclinicoId: entity.examenclinicoId,
      nombreArchivoPdf:
        entity.nombreArchivoPdf ?? `examen-${entity.examenclinicoId}.pdf`,
      mimeArchivoPdf: entity.mimeArchivoPdf ?? "application/pdf",
      archivoPdfBase64: entity.archivoPdf.toString("base64"),
    };
  }

  /**
   * Convierte el valor a response.
   * @param entity Valor del parámetro `entity`.
   * @returns Valor convertido al formato de salida esperado.
   */
  private toResponse(entity: Examenclinico) {
    return {
      examenclinicoId: entity.examenclinicoId,
      pacienteId: entity.pacienteId,
      consultaId: entity.consultaId ?? null,
      nombreExamen: entity.nombreExamen,
      tipoExamen: entity.tipoExamen ?? null,
      laboratorio: entity.laboratorio ?? null,
      fechaExamen: entity.fechaExamen,
      fechaResultado: entity.fechaResultado ?? null,
      resultadoTexto: entity.resultadoTexto ?? null,
      observaciones: entity.observaciones ?? null,
      nombreArchivoPdf: entity.nombreArchivoPdf ?? null,
      mimeArchivoPdf: entity.mimeArchivoPdf ?? null,
      tieneArchivoPdf: !!entity.mimeArchivoPdf,
      creadoPor: entity.creadoPor ?? null,
      creadoEn: entity.creadoEn,
      modificadoPor: entity.modificadoPor ?? null,
      modificadoEn: entity.modificadoEn ?? null,
      campoPrueba01: entity.campoPrueba01 ?? null,
      campoPrueba02: entity.campoPrueba02 ?? null,
      campoPrueba03: entity.campoPrueba03 ?? null,
      campoPrueba04: entity.campoPrueba04 ?? null,
      campoPrueba05: entity.campoPrueba05 ?? null,
    };
  }

  /**
   * Decode pdf.
   * @param value Valor de entrada que se debe transformar o validar.
   * @param field Valor del parámetro `field`.
   * @returns Resultado de la operación.
   */
  private decodePdf(
    value: string | null | undefined,
    field: string,
  ): Buffer | null | undefined {
    if (value === undefined) {
      return undefined;
    }
    if (value === null) {
      return null;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    if (
      trimmed.startsWith("data:") &&
      !trimmed.toLowerCase().startsWith("data:application/pdf;")
    ) {
      throw new BadRequestException(`${field} debe contener un pdf en base64`);
    }

    const payload = trimmed.startsWith("data:")
      ? (trimmed.split(",", 2)[1] ?? "").trim()
      : trimmed.replace(/\s+/g, "");

    if (
      !payload ||
      payload.length % 4 !== 0 ||
      !/^[A-Za-z0-9+/]+={0,2}$/.test(payload)
    ) {
      throw new BadRequestException(
        `${field} debe ser una cadena base64 valida`,
      );
    }

    const buffer = Buffer.from(payload, "base64");
    if (!buffer.length) {
      throw new BadRequestException(`${field} no contiene datos validos`);
    }
    if (buffer.length < 4 || buffer.subarray(0, 4).toString() !== "%PDF") {
      throw new BadRequestException(
        `${field} no corresponde a un archivo pdf valido`,
      );
    }
    return buffer;
  }

  /**
   * Normalize file name.
   * @param value Valor de entrada que se debe transformar o validar.
   * @returns Resultado de la operación.
   */
  private normalizeFileName(value: string | null | undefined): string | null {
    if (value === undefined || value === null) {
      return null;
    }

    const normalized = value.trim();
    if (!normalized) {
      return null;
    }

    return normalized.toLowerCase().endsWith(".pdf")
      ? normalized
      : `${normalized}.pdf`;
  }
}
