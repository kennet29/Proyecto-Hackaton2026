import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindOptionsWhere, Repository } from "typeorm";
import { Institucionsalud } from "../institucionsalud/institucionsalud.entity";
import { Medicamentoraro } from "../medicamentoraro/medicamentoraro.entity";
import { CreateInstitucionmedicamentoDto } from "./dto/create-institucionmedicamento.dto";
import { UpdateInstitucionmedicamentoDto } from "./dto/update-institucionmedicamento.dto";
import { Institucionmedicamento } from "./institucionmedicamento.entity";

/**
 * Define el tipo institucion medicamento filters utilizado por el backend.
 */
type InstitucionMedicamentoFilters = {
  /**
   * Identificador persistido para `institucionSaludId`.
   */
  institucionSaludId?: number;
  /**
   * Identificador persistido para `medicamentoRaroId`.
   */
  medicamentoRaroId?: number;
  /**
   * Campo de datos asociado a `disponibilidad`.
   */
  disponibilidad?: string;
};

/**
 * Implementa la lógica de negocio y persistencia del dominio institucionmedicamento.
 */
@Injectable()
export class InstitucionmedicamentoService {
  constructor(
    @InjectRepository(Institucionmedicamento)
    private readonly institucionMedicamentoRepository: Repository<Institucionmedicamento>,
    @InjectRepository(Institucionsalud)
    private readonly institucionRepository: Repository<Institucionsalud>,
    @InjectRepository(Medicamentoraro)
    private readonly medicamentoRaroRepository: Repository<Medicamentoraro>,
  ) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  async create(
    payload: CreateInstitucionmedicamentoDto,
  ): Promise<Institucionmedicamento> {
    await this.assertReferences(
      payload.institucionSaludId,
      payload.medicamentoRaroId,
    );
    await this.assertUniquePair(
      payload.institucionSaludId,
      payload.medicamentoRaroId,
    );

    const entity = this.institucionMedicamentoRepository.create({
      ...payload,
      disponibilidad: payload.disponibilidad ?? "limitado",
      fechaUltimaActualizacion: payload.fechaUltimaActualizacion ?? new Date(),
      creadoEn: payload.creadoEn ?? new Date(),
      modificadoEn: payload.modificadoEn ?? null,
    });
    return this.institucionMedicamentoRepository.save(entity);
  }

  /**
   * Find all.
   * @param filters Valor del parámetro `filters`.
   * @returns Colección de registros encontrados.
   */
  async findAll(
    filters: InstitucionMedicamentoFilters = {},
  ): Promise<Institucionmedicamento[]> {
    const where: FindOptionsWhere<Institucionmedicamento> = {};
    if (filters.institucionSaludId !== undefined) {
      where.institucionSaludId = filters.institucionSaludId;
    }
    if (filters.medicamentoRaroId !== undefined) {
      where.medicamentoRaroId = filters.medicamentoRaroId;
    }
    if (filters.disponibilidad) {
      where.disponibilidad = filters.disponibilidad;
    }
    return this.institucionMedicamentoRepository.find({
      where,
      order: { fechaUltimaActualizacion: "DESC" },
    });
  }

  /**
   * Find one.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  async findOne(id: number): Promise<Institucionmedicamento> {
    const entity = await this.institucionMedicamentoRepository.findOne({
      where: { institucionMedicamentoId: id },
    });
    if (!entity) {
      throw new NotFoundException(
        `relacion institucion-medicamento ${id} no encontrada`,
      );
    }
    return entity;
  }

  /**
   * Update.
   * @param id Identificador del registro objetivo.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro actualizado.
   */
  async update(
    id: number,
    payload: UpdateInstitucionmedicamentoDto,
  ): Promise<Institucionmedicamento> {
    const entity = await this.findOne(id);
    const nextInstitucionId =
      payload.institucionSaludId ?? entity.institucionSaludId;
    const nextMedicamentoId =
      payload.medicamentoRaroId ?? entity.medicamentoRaroId;

    await this.assertReferences(nextInstitucionId, nextMedicamentoId);
    if (
      nextInstitucionId !== entity.institucionSaludId ||
      nextMedicamentoId !== entity.medicamentoRaroId
    ) {
      await this.assertUniquePair(nextInstitucionId, nextMedicamentoId, id);
    }

    Object.assign(entity, payload);
    entity.fechaUltimaActualizacion =
      payload.fechaUltimaActualizacion ?? new Date();
    entity.modificadoEn = payload.modificadoEn ?? new Date();
    return this.institucionMedicamentoRepository.save(entity);
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  async remove(id: number): Promise<void> {
    const result = await this.institucionMedicamentoRepository.delete({
      institucionMedicamentoId: id,
    });
    if (!result.affected) {
      throw new NotFoundException(
        `relacion institucion-medicamento ${id} no encontrada`,
      );
    }
  }

  /**
   * Valida references.
   * @param institucionSaludId Identificador asociado a institucion salud.
   * @param medicamentoRaroId Identificador asociado a medicamento raro.
   * @returns La promesa se resuelve cuando la validación se cumple.
   */
  private async assertReferences(
    institucionSaludId: number,
    medicamentoRaroId: number,
  ): Promise<void> {
    const institucion = await this.institucionRepository.findOne({
      where: { institucionSaludId },
    });
    if (!institucion) {
      throw new BadRequestException(
        `institucion ${institucionSaludId} no existe`,
      );
    }

    const medicamento = await this.medicamentoRaroRepository.findOne({
      where: { medicamentoRaroId },
    });
    if (!medicamento) {
      throw new BadRequestException(
        `medicamento raro ${medicamentoRaroId} no existe`,
      );
    }
  }

  /**
   * Valida unique pair.
   * @param institucionSaludId Identificador asociado a institucion salud.
   * @param medicamentoRaroId Identificador asociado a medicamento raro.
   * @param currentId Identificador asociado a current.
   * @returns La promesa se resuelve cuando la validación se cumple.
   */
  private async assertUniquePair(
    institucionSaludId: number,
    medicamentoRaroId: number,
    currentId?: number,
  ): Promise<void> {
    const existing = await this.institucionMedicamentoRepository.findOne({
      where: { institucionSaludId, medicamentoRaroId },
    });
    if (existing && existing.institucionMedicamentoId !== currentId) {
      throw new BadRequestException(
        "esta institucion ya tiene registrado ese medicamento raro",
      );
    }
  }
}
