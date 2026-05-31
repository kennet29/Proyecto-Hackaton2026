import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindOptionsWhere, QueryFailedError, Repository } from "typeorm";
import { Catalogoservicio } from "./catalogoservicio.entity";
import { CreateCatalogoservicioDto } from "./dto/create-catalogoservicio.dto";
import { UpdateCatalogoservicioDto } from "./dto/update-catalogoservicio.dto";

/**
 * Define el tipo catalogo servicio filters utilizado por el backend.
 */
type CatalogoServicioFilters = {
  /**
   * Campo de datos asociado a `categoria`.
   */
  categoria?: string;
  /**
   * Campo de datos asociado a `activo`.
   */
  activo?: boolean;
};

/**
 * Implementa la lógica de negocio y persistencia del dominio catalogoservicio.
 */
@Injectable()
export class CatalogoservicioService {
  constructor(
    @InjectRepository(Catalogoservicio)
    private readonly catalogoServicioRepository: Repository<Catalogoservicio>,
  ) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  async create(payload: CreateCatalogoservicioDto): Promise<Catalogoservicio> {
    try {
      const entity = this.catalogoServicioRepository.create({
        ...payload,
        requierePreparacion: payload.requierePreparacion ?? false,
        requiereReferencia: payload.requiereReferencia ?? false,
        activo: payload.activo ?? true,
        creadoEn: payload.creadoEn ?? new Date(),
        modificadoEn: payload.modificadoEn ?? null,
      });
      return await this.catalogoServicioRepository.save(entity);
    } catch (error) {
      this.handleUniqueCodeError(error);
    }
  }

  /**
   * Find all.
   * @param filters Valor del parámetro `filters`.
   * @returns Colección de registros encontrados.
   */
  async findAll(
    filters: CatalogoServicioFilters = {},
  ): Promise<Catalogoservicio[]> {
    const where: FindOptionsWhere<Catalogoservicio> = {};
    if (filters.categoria) {
      where.categoria = filters.categoria;
    }
    if (filters.activo !== undefined) {
      where.activo = filters.activo;
    }
    return this.catalogoServicioRepository.find({
      where,
      order: { nombre: "ASC" },
    });
  }

  /**
   * Find one.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  async findOne(id: number): Promise<Catalogoservicio> {
    const entity = await this.catalogoServicioRepository.findOne({
      where: { catalogoServicioId: id },
    });
    if (!entity) {
      throw new NotFoundException(`servicio ${id} no encontrado`);
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
    payload: UpdateCatalogoservicioDto,
  ): Promise<Catalogoservicio> {
    const entity = await this.findOne(id);
    Object.assign(entity, payload);
    entity.modificadoEn = payload.modificadoEn ?? new Date();
    try {
      return await this.catalogoServicioRepository.save(entity);
    } catch (error) {
      this.handleUniqueCodeError(error);
    }
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  async remove(id: number): Promise<void> {
    const result = await this.catalogoServicioRepository.delete({
      catalogoServicioId: id,
    });
    if (!result.affected) {
      throw new NotFoundException(`servicio ${id} no encontrado`);
    }
  }

  /**
   * Handle unique code error.
   * @param error Error original que se está procesando.
   * @returns Resultado de la operación.
   */
  private handleUniqueCodeError(error: unknown): never {
    if (error instanceof QueryFailedError) {
      const driverError = error.driverError as
        | {
            /**
             * Campo de datos asociado a `number`.
             */
            number?: number;
          }
        | undefined;
      if (driverError?.number === 2627 || driverError?.number === 2601) {
        throw new BadRequestException("ya existe un servicio con ese codigo");
      }
    }
    throw error as Error;
  }
}
