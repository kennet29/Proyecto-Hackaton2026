import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Institucionsalud } from '../institucionsalud/institucionsalud.entity';
import { Medicamentoraro } from '../medicamentoraro/medicamentoraro.entity';
import { CreateInstitucionmedicamentoDto } from './dto/create-institucionmedicamento.dto';
import { UpdateInstitucionmedicamentoDto } from './dto/update-institucionmedicamento.dto';
import { Institucionmedicamento } from './institucionmedicamento.entity';

type InstitucionMedicamentoFilters = {
  institucionSaludId?: number;
  medicamentoRaroId?: number;
  disponibilidad?: string;
};

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

  async create(payload: CreateInstitucionmedicamentoDto): Promise<Institucionmedicamento> {
    await this.assertReferences(payload.institucionSaludId, payload.medicamentoRaroId);
    await this.assertUniquePair(payload.institucionSaludId, payload.medicamentoRaroId);

    const entity = this.institucionMedicamentoRepository.create({
      ...payload,
      disponibilidad: payload.disponibilidad ?? 'limitado',
      fechaUltimaActualizacion: payload.fechaUltimaActualizacion ?? new Date(),
      creadoEn: payload.creadoEn ?? new Date(),
      modificadoEn: payload.modificadoEn ?? null,
    });
    return this.institucionMedicamentoRepository.save(entity);
  }

  async findAll(filters: InstitucionMedicamentoFilters = {}): Promise<Institucionmedicamento[]> {
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
      order: { fechaUltimaActualizacion: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Institucionmedicamento> {
    const entity = await this.institucionMedicamentoRepository.findOne({
      where: { institucionMedicamentoId: id },
    });
    if (!entity) {
      throw new NotFoundException(`relacion institucion-medicamento ${id} no encontrada`);
    }
    return entity;
  }

  async update(
    id: number,
    payload: UpdateInstitucionmedicamentoDto,
  ): Promise<Institucionmedicamento> {
    const entity = await this.findOne(id);
    const nextInstitucionId = payload.institucionSaludId ?? entity.institucionSaludId;
    const nextMedicamentoId = payload.medicamentoRaroId ?? entity.medicamentoRaroId;

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

  async remove(id: number): Promise<void> {
    const result = await this.institucionMedicamentoRepository.delete({
      institucionMedicamentoId: id,
    });
    if (!result.affected) {
      throw new NotFoundException(`relacion institucion-medicamento ${id} no encontrada`);
    }
  }

  private async assertReferences(
    institucionSaludId: number,
    medicamentoRaroId: number,
  ): Promise<void> {
    const institucion = await this.institucionRepository.findOne({
      where: { institucionSaludId },
    });
    if (!institucion) {
      throw new BadRequestException(`institucion ${institucionSaludId} no existe`);
    }

    const medicamento = await this.medicamentoRaroRepository.findOne({
      where: { medicamentoRaroId },
    });
    if (!medicamento) {
      throw new BadRequestException(`medicamento raro ${medicamentoRaroId} no existe`);
    }
  }

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
        'esta institucion ya tiene registrado ese medicamento raro',
      );
    }
  }
}
