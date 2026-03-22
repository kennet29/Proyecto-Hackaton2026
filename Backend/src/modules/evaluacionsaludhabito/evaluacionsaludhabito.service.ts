import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Evaluacionsaludhabito } from './evaluacionsaludhabito.entity';
import { CreateEvaluacionsaludhabitoDto } from './dto/create-evaluacionsaludhabito.dto';
import { UpdateEvaluacionsaludhabitoDto } from './dto/update-evaluacionsaludhabito.dto';

const PRIMARY_KEYS = ["evaluacionId"];
const PRIMARY_KEY_TYPES: Record<string, 'number' | 'string' | 'boolean' | 'Date'> = {
  evaluacionId: 'number',
};

@Injectable()
export class EvaluacionsaludhabitoService {
  constructor(
    @InjectRepository(Evaluacionsaludhabito)
    private readonly evaluacionsaludhabitoRepository: Repository<Evaluacionsaludhabito>,
  ) {}

  create(payload: CreateEvaluacionsaludhabitoDto): Promise<Evaluacionsaludhabito> {
    const entity = this.evaluacionsaludhabitoRepository.create(payload as Partial<Evaluacionsaludhabito>);
    return this.evaluacionsaludhabitoRepository.save(entity);
  }

  findAll(): Promise<Evaluacionsaludhabito[]> {
    return this.evaluacionsaludhabitoRepository.find();
  }

  async findOne(id: string): Promise<Evaluacionsaludhabito> {
    const where = this.parseId(id);
    const entity = await this.evaluacionsaludhabitoRepository.findOne({ where });
    if (!entity) {
      throw new NotFoundException(`registro ${id} no encontrado en evaluacionsaludhabito`);
    }
    return entity;
  }

  async update(id: string, payload: UpdateEvaluacionsaludhabitoDto): Promise<Evaluacionsaludhabito> {
    const entity = await this.findOne(id);
    Object.assign(entity, payload);
    return this.evaluacionsaludhabitoRepository.save(entity);
  }

  async remove(id: string): Promise<void> {
    const where = this.parseId(id);
    const result = await this.evaluacionsaludhabitoRepository.delete(where);
    if (!result.affected) {
      throw new NotFoundException(`registro ${id} no encontrado en evaluacionsaludhabito`);
    }
  }

  private parseId(rawId: string): Record<string, any> {
    if (!PRIMARY_KEYS.length) {
      throw new BadRequestException('la tabla no define una clave primaria');
    }
    if (PRIMARY_KEYS.length === 1) {
      const key = PRIMARY_KEYS[0];
      return { [key]: this.castValue(rawId, PRIMARY_KEY_TYPES[key]) };
    }
    const segments = rawId.split(',').map((segment) => segment.trim());
    if (segments.length !== PRIMARY_KEYS.length) {
      throw new BadRequestException('usa valores separados por coma siguiendo el orden de la clave primaria');
    }
    const where: Record<string, any> = {};
    segments.forEach((segment, index) => {
      const key = PRIMARY_KEYS[index];
      where[key] = this.castValue(segment, PRIMARY_KEY_TYPES[key]);
    });
    return where;
  }

  private castValue(value: string, type: string): any {
    if (type === 'number') {
      const num = Number(value);
      if (Number.isNaN(num)) {
        throw new BadRequestException('el identificador debe ser numerico');
      }
      return num;
    }
    if (type === 'boolean') {
      if (value === '1' || value.toLowerCase() === 'true') {
        return true;
      }
      if (value === '0' || value.toLowerCase() === 'false') {
        return false;
      }
      throw new BadRequestException('el identificador booleano es invalido');
    }
    if (type === 'Date') {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        throw new BadRequestException('el identificador de fecha es invalido');
      }
      return date;
    }
    return value;
  }
}
