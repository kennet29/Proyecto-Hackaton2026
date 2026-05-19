import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindOptionsWhere, Repository } from "typeorm";
import { CreateMedicamentoraroDto } from "./dto/create-medicamentoraro.dto";
import { UpdateMedicamentoraroDto } from "./dto/update-medicamentoraro.dto";
import { Medicamentoraro } from "./medicamentoraro.entity";

/**
 * Define el tipo medicamento raro filters utilizado por el backend.
 */
type MedicamentoRaroFilters = {
  /**
   * Campo de datos asociado a `activo`.
   */
  activo?: boolean;
  /**
   * Indicador booleano persistido en `requiereReceta`.
   */
  requiereReceta?: boolean;
  /**
   * Campo de datos asociado a `controlado`.
   */
  controlado?: boolean;
};

/**
 * Implementa la lógica de negocio y persistencia del dominio medicamentoraro.
 */
@Injectable()
export class MedicamentoraroService {
  constructor(
    @InjectRepository(Medicamentoraro)
    private readonly medicamentoRaroRepository: Repository<Medicamentoraro>,
  ) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  create(payload: CreateMedicamentoraroDto): Promise<Medicamentoraro> {
    const entity = this.medicamentoRaroRepository.create({
      ...payload,
      requiereReceta: payload.requiereReceta ?? true,
      controlado: payload.controlado ?? false,
      activo: payload.activo ?? true,
      creadoEn: payload.creadoEn ?? new Date(),
      modificadoEn: payload.modificadoEn ?? null,
    });
    return this.medicamentoRaroRepository.save(entity);
  }

  /**
   * Find all.
   * @param filters Valor del parámetro `filters`.
   * @returns Colección de registros encontrados.
   */
  async findAll(
    filters: MedicamentoRaroFilters = {},
  ): Promise<Medicamentoraro[]> {
    const where: FindOptionsWhere<Medicamentoraro> = {};
    if (filters.activo !== undefined) {
      where.activo = filters.activo;
    }
    if (filters.requiereReceta !== undefined) {
      where.requiereReceta = filters.requiereReceta;
    }
    if (filters.controlado !== undefined) {
      where.controlado = filters.controlado;
    }
    return this.medicamentoRaroRepository.find({
      where,
      order: { nombreGenerico: "ASC" },
    });
  }

  /**
   * Find one.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  async findOne(id: number): Promise<Medicamentoraro> {
    const entity = await this.medicamentoRaroRepository.findOne({
      where: { medicamentoRaroId: id },
    });
    if (!entity) {
      throw new NotFoundException(`medicamento raro ${id} no encontrado`);
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
    payload: UpdateMedicamentoraroDto,
  ): Promise<Medicamentoraro> {
    const entity = await this.findOne(id);
    Object.assign(entity, payload);
    entity.modificadoEn = payload.modificadoEn ?? new Date();
    return this.medicamentoRaroRepository.save(entity);
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  async remove(id: number): Promise<void> {
    const result = await this.medicamentoRaroRepository.delete({
      medicamentoRaroId: id,
    });
    if (!result.affected) {
      throw new NotFoundException(`medicamento raro ${id} no encontrado`);
    }
  }
}
