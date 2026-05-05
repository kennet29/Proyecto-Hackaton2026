import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Especialidad } from '../especialidad/especialidad.entity';
import { Institucionsalud } from '../institucionsalud/institucionsalud.entity';
import { CreateInstitucionespecialidadDto } from './dto/create-institucionespecialidad.dto';
import { UpdateInstitucionespecialidadDto } from './dto/update-institucionespecialidad.dto';
import { Institucionespecialidad } from './institucionespecialidad.entity';

type InstitucionEspecialidadFilters = {
  institucionSaludId?: number;
  especialidadId?: number;
  activo?: boolean;
  destacada?: boolean;
};

@Injectable()
export class InstitucionespecialidadService {
  constructor(
    @InjectRepository(Institucionespecialidad)
    private readonly institucionEspecialidadRepository: Repository<Institucionespecialidad>,
    @InjectRepository(Institucionsalud)
    private readonly institucionRepository: Repository<Institucionsalud>,
    @InjectRepository(Especialidad)
    private readonly especialidadRepository: Repository<Especialidad>,
  ) {}

  async create(payload: CreateInstitucionespecialidadDto): Promise<Institucionespecialidad> {
    await this.assertReferences(payload.institucionSaludId, payload.especialidadId);
    await this.assertUniquePair(payload.institucionSaludId, payload.especialidadId);

    const entity = this.institucionEspecialidadRepository.create({
      ...payload,
      destacada: payload.destacada ?? false,
      activo: payload.activo ?? true,
      creadoEn: payload.creadoEn ?? new Date(),
      modificadoEn: payload.modificadoEn ?? null,
    });
    return this.institucionEspecialidadRepository.save(entity);
  }

  async findAll(filters: InstitucionEspecialidadFilters = {}): Promise<Institucionespecialidad[]> {
    const where: FindOptionsWhere<Institucionespecialidad> = {};
    if (filters.institucionSaludId !== undefined) {
      where.institucionSaludId = filters.institucionSaludId;
    }
    if (filters.especialidadId !== undefined) {
      where.especialidadId = filters.especialidadId;
    }
    if (filters.activo !== undefined) {
      where.activo = filters.activo;
    }
    if (filters.destacada !== undefined) {
      where.destacada = filters.destacada;
    }
    return this.institucionEspecialidadRepository.find({
      where,
      order: { destacada: 'DESC', institucionEspecialidadId: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Institucionespecialidad> {
    const entity = await this.institucionEspecialidadRepository.findOne({
      where: { institucionEspecialidadId: id },
    });
    if (!entity) {
      throw new NotFoundException(`relacion institucion-especialidad ${id} no encontrada`);
    }
    return entity;
  }

  async update(
    id: number,
    payload: UpdateInstitucionespecialidadDto,
  ): Promise<Institucionespecialidad> {
    const entity = await this.findOne(id);
    const nextInstitucionId = payload.institucionSaludId ?? entity.institucionSaludId;
    const nextEspecialidadId = payload.especialidadId ?? entity.especialidadId;

    await this.assertReferences(nextInstitucionId, nextEspecialidadId);
    if (
      nextInstitucionId !== entity.institucionSaludId ||
      nextEspecialidadId !== entity.especialidadId
    ) {
      await this.assertUniquePair(nextInstitucionId, nextEspecialidadId, id);
    }

    Object.assign(entity, payload);
    entity.modificadoEn = payload.modificadoEn ?? new Date();
    return this.institucionEspecialidadRepository.save(entity);
  }

  async remove(id: number): Promise<void> {
    const result = await this.institucionEspecialidadRepository.delete({
      institucionEspecialidadId: id,
    });
    if (!result.affected) {
      throw new NotFoundException(`relacion institucion-especialidad ${id} no encontrada`);
    }
  }

  private async assertReferences(
    institucionSaludId: number,
    especialidadId: number,
  ): Promise<void> {
    const institucion = await this.institucionRepository.findOne({
      where: { institucionSaludId },
    });
    if (!institucion) {
      throw new BadRequestException(`institucion ${institucionSaludId} no existe`);
    }
    const especialidad = await this.especialidadRepository.findOne({
      where: { especialidadId },
    });
    if (!especialidad) {
      throw new BadRequestException(`especialidad ${especialidadId} no existe`);
    }
  }

  private async assertUniquePair(
    institucionSaludId: number,
    especialidadId: number,
    currentId?: number,
  ): Promise<void> {
    const existing = await this.institucionEspecialidadRepository.findOne({
      where: { institucionSaludId, especialidadId },
    });
    if (existing && existing.institucionEspecialidadId !== currentId) {
      throw new BadRequestException(
        'esta institucion ya tiene registrada esa especialidad',
      );
    }
  }
}
