import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindOptionsWhere, Repository } from "typeorm";
import { Catalogoservicio } from "../catalogoservicio/catalogoservicio.entity";
import { Institucionsalud } from "../institucionsalud/institucionsalud.entity";
import { CreateInstitucionservicioDto } from "./dto/create-institucionservicio.dto";
import { UpdateInstitucionservicioDto } from "./dto/update-institucionservicio.dto";
import { Institucionservicio } from "./institucionservicio.entity";

/**
 * Define el tipo institucion servicio filters utilizado por el backend.
 */
type InstitucionServicioFilters = {
  /**
   * Identificador persistido para `institucionSaludId`.
   */
  institucionSaludId?: number;
  /**
   * Identificador persistido para `catalogoServicioId`.
   */
  catalogoServicioId?: number;
  /**
   * Campo de datos asociado a `disponible`.
   */
  disponible?: boolean;
};

/**
 * Implementa la lógica de negocio y persistencia del dominio institucionservicio.
 */
@Injectable()
export class InstitucionservicioService {
  constructor(
    @InjectRepository(Institucionservicio)
    private readonly institucionServicioRepository: Repository<Institucionservicio>,
    @InjectRepository(Institucionsalud)
    private readonly institucionRepository: Repository<Institucionsalud>,
    @InjectRepository(Catalogoservicio)
    private readonly catalogoServicioRepository: Repository<Catalogoservicio>,
  ) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  async create(
    payload: CreateInstitucionservicioDto,
  ): Promise<Institucionservicio> {
    await this.assertReferences(
      payload.institucionSaludId,
      payload.catalogoServicioId,
    );
    await this.assertUniquePair(
      payload.institucionSaludId,
      payload.catalogoServicioId,
    );

    const entity = this.institucionServicioRepository.create({
      ...payload,
      disponible: payload.disponible ?? true,
      creadoEn: payload.creadoEn ?? new Date(),
      modificadoEn: payload.modificadoEn ?? null,
    });
    return this.institucionServicioRepository.save(entity);
  }

  /**
   * Find all.
   * @param filters Valor del parámetro `filters`.
   * @returns Colección de registros encontrados.
   */
  async findAll(
    filters: InstitucionServicioFilters = {},
  ): Promise<Institucionservicio[]> {
    const where: FindOptionsWhere<Institucionservicio> = {};
    if (filters.institucionSaludId !== undefined) {
      where.institucionSaludId = filters.institucionSaludId;
    }
    if (filters.catalogoServicioId !== undefined) {
      where.catalogoServicioId = filters.catalogoServicioId;
    }
    if (filters.disponible !== undefined) {
      where.disponible = filters.disponible;
    }
    return this.institucionServicioRepository.find({
      where,
      order: { institucionServicioId: "DESC" },
    });
  }

  /**
   * Find one.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  async findOne(id: number): Promise<Institucionservicio> {
    const entity = await this.institucionServicioRepository.findOne({
      where: { institucionServicioId: id },
    });
    if (!entity) {
      throw new NotFoundException(
        `relacion institucion-servicio ${id} no encontrada`,
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
    payload: UpdateInstitucionservicioDto,
  ): Promise<Institucionservicio> {
    const entity = await this.findOne(id);
    const nextInstitucionId =
      payload.institucionSaludId ?? entity.institucionSaludId;
    const nextServicioId =
      payload.catalogoServicioId ?? entity.catalogoServicioId;

    await this.assertReferences(nextInstitucionId, nextServicioId);
    if (
      nextInstitucionId !== entity.institucionSaludId ||
      nextServicioId !== entity.catalogoServicioId
    ) {
      await this.assertUniquePair(nextInstitucionId, nextServicioId, id);
    }

    Object.assign(entity, payload);
    entity.modificadoEn = payload.modificadoEn ?? new Date();
    return this.institucionServicioRepository.save(entity);
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  async remove(id: number): Promise<void> {
    const result = await this.institucionServicioRepository.delete({
      institucionServicioId: id,
    });
    if (!result.affected) {
      throw new NotFoundException(
        `relacion institucion-servicio ${id} no encontrada`,
      );
    }
  }

  /**
   * Valida references.
   * @param institucionSaludId Identificador asociado a institucion salud.
   * @param catalogoServicioId Identificador asociado a catalogo servicio.
   * @returns La promesa se resuelve cuando la validación se cumple.
   */
  private async assertReferences(
    institucionSaludId: number,
    catalogoServicioId: number,
  ): Promise<void> {
    const institucion = await this.institucionRepository.findOne({
      where: { institucionSaludId },
    });
    if (!institucion) {
      throw new BadRequestException(
        `institucion ${institucionSaludId} no existe`,
      );
    }

    const servicio = await this.catalogoServicioRepository.findOne({
      where: { catalogoServicioId },
    });
    if (!servicio) {
      throw new BadRequestException(`servicio ${catalogoServicioId} no existe`);
    }
  }

  /**
   * Valida unique pair.
   * @param institucionSaludId Identificador asociado a institucion salud.
   * @param catalogoServicioId Identificador asociado a catalogo servicio.
   * @param currentId Identificador asociado a current.
   * @returns La promesa se resuelve cuando la validación se cumple.
   */
  private async assertUniquePair(
    institucionSaludId: number,
    catalogoServicioId: number,
    currentId?: number,
  ): Promise<void> {
    const existing = await this.institucionServicioRepository.findOne({
      where: { institucionSaludId, catalogoServicioId },
    });
    if (existing && existing.institucionServicioId !== currentId) {
      throw new BadRequestException(
        "esta institucion ya tiene registrado ese servicio",
      );
    }
  }
}
