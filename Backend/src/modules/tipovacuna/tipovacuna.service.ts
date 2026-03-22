import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tipovacuna } from './tipovacuna.entity';
import { CreateTipovacunaDto } from './dto/create-tipovacuna.dto';
import { UpdateTipovacunaDto } from './dto/update-tipovacuna.dto';

const PRIMARY_KEYS = ["tipovacunaId"];
const PRIMARY_KEY_TYPES: Record<string, 'number' | 'string' | 'boolean' | 'Date'> = {
  tipovacunaId: 'number',
};

@Injectable()
export class TipovacunaService {
  constructor(
    @InjectRepository(Tipovacuna)
    private readonly tipovacunaRepository: Repository<Tipovacuna>,
  ) {}

  create(payload: CreateTipovacunaDto): Promise<Tipovacuna> {
    const entity = this.tipovacunaRepository.create(payload as Partial<Tipovacuna>);
    return this.tipovacunaRepository.save(entity);
  }

  findAll(): Promise<Tipovacuna[]> {
    return this.tipovacunaRepository.find();
  }

  async findOne(id: string): Promise<Tipovacuna> {
    const where = this.parseId(id);
    const entity = await this.tipovacunaRepository.findOne({ where });
    if (!entity) {
      throw new NotFoundException(`registro ${id} no encontrado en tipovacuna`);
    }
    return entity;
  }

  async update(id: string, payload: UpdateTipovacunaDto): Promise<Tipovacuna> {
    const entity = await this.findOne(id);
    Object.assign(entity, payload);
    return this.tipovacunaRepository.save(entity);
  }

  async remove(id: string): Promise<void> {
    const where = this.parseId(id);
    const result = await this.tipovacunaRepository.delete(where);
    if (!result.affected) {
      throw new NotFoundException(`registro ${id} no encontrado en tipovacuna`);
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
