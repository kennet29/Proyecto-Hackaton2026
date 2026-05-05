import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Catalogoservicio } from '../catalogoservicio/catalogoservicio.entity';
import { Institucionsalud } from '../institucionsalud/institucionsalud.entity';
import { CreateInstitucionservicioDto } from './dto/create-institucionservicio.dto';
import { UpdateInstitucionservicioDto } from './dto/update-institucionservicio.dto';
import { Institucionservicio } from './institucionservicio.entity';

type InstitucionServicioFilters = {
  institucionSaludId?: number;
  catalogoServicioId?: number;
  disponible?: boolean;
};

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

  async create(payload: CreateInstitucionservicioDto): Promise<Institucionservicio> {
    await this.assertReferences(payload.institucionSaludId, payload.catalogoServicioId);
    await this.assertUniquePair(payload.institucionSaludId, payload.catalogoServicioId);

    const entity = this.institucionServicioRepository.create({
      ...payload,
      disponible: payload.disponible ?? true,
      creadoEn: payload.creadoEn ?? new Date(),
      modificadoEn: payload.modificadoEn ?? null,
    });
    return this.institucionServicioRepository.save(entity);
  }

  async findAll(filters: InstitucionServicioFilters = {}): Promise<Institucionservicio[]> {
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
      order: { institucionServicioId: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Institucionservicio> {
    const entity = await this.institucionServicioRepository.findOne({
      where: { institucionServicioId: id },
    });
    if (!entity) {
      throw new NotFoundException(`relacion institucion-servicio ${id} no encontrada`);
    }
    return entity;
  }

  async update(id: number, payload: UpdateInstitucionservicioDto): Promise<Institucionservicio> {
    const entity = await this.findOne(id);
    const nextInstitucionId = payload.institucionSaludId ?? entity.institucionSaludId;
    const nextServicioId = payload.catalogoServicioId ?? entity.catalogoServicioId;

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

  async remove(id: number): Promise<void> {
    const result = await this.institucionServicioRepository.delete({
      institucionServicioId: id,
    });
    if (!result.affected) {
      throw new NotFoundException(`relacion institucion-servicio ${id} no encontrada`);
    }
  }

  private async assertReferences(
    institucionSaludId: number,
    catalogoServicioId: number,
  ): Promise<void> {
    const institucion = await this.institucionRepository.findOne({
      where: { institucionSaludId },
    });
    if (!institucion) {
      throw new BadRequestException(`institucion ${institucionSaludId} no existe`);
    }

    const servicio = await this.catalogoServicioRepository.findOne({
      where: { catalogoServicioId },
    });
    if (!servicio) {
      throw new BadRequestException(`servicio ${catalogoServicioId} no existe`);
    }
  }

  private async assertUniquePair(
    institucionSaludId: number,
    catalogoServicioId: number,
    currentId?: number,
  ): Promise<void> {
    const existing = await this.institucionServicioRepository.findOne({
      where: { institucionSaludId, catalogoServicioId },
    });
    if (existing && existing.institucionServicioId !== currentId) {
      throw new BadRequestException('esta institucion ya tiene registrado ese servicio');
    }
  }
}
