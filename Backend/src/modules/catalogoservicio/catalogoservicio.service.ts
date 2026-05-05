import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, QueryFailedError, Repository } from 'typeorm';
import { Catalogoservicio } from './catalogoservicio.entity';
import { CreateCatalogoservicioDto } from './dto/create-catalogoservicio.dto';
import { UpdateCatalogoservicioDto } from './dto/update-catalogoservicio.dto';

type CatalogoServicioFilters = {
  categoria?: string;
  activo?: boolean;
};

@Injectable()
export class CatalogoservicioService {
  constructor(
    @InjectRepository(Catalogoservicio)
    private readonly catalogoServicioRepository: Repository<Catalogoservicio>,
  ) {}

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

  async findAll(filters: CatalogoServicioFilters = {}): Promise<Catalogoservicio[]> {
    const where: FindOptionsWhere<Catalogoservicio> = {};
    if (filters.categoria) {
      where.categoria = filters.categoria;
    }
    if (filters.activo !== undefined) {
      where.activo = filters.activo;
    }
    return this.catalogoServicioRepository.find({
      where,
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Catalogoservicio> {
    const entity = await this.catalogoServicioRepository.findOne({
      where: { catalogoServicioId: id },
    });
    if (!entity) {
      throw new NotFoundException(`servicio ${id} no encontrado`);
    }
    return entity;
  }

  async update(id: number, payload: UpdateCatalogoservicioDto): Promise<Catalogoservicio> {
    const entity = await this.findOne(id);
    Object.assign(entity, payload);
    entity.modificadoEn = payload.modificadoEn ?? new Date();
    try {
      return await this.catalogoServicioRepository.save(entity);
    } catch (error) {
      this.handleUniqueCodeError(error);
    }
  }

  async remove(id: number): Promise<void> {
    const result = await this.catalogoServicioRepository.delete({
      catalogoServicioId: id,
    });
    if (!result.affected) {
      throw new NotFoundException(`servicio ${id} no encontrado`);
    }
  }

  private handleUniqueCodeError(error: unknown): never {
    if (error instanceof QueryFailedError) {
      const driverError = error.driverError as { number?: number } | undefined;
      if (driverError?.number === 2627 || driverError?.number === 2601) {
        throw new BadRequestException('ya existe un servicio con ese codigo');
      }
    }
    throw error as Error;
  }
}
