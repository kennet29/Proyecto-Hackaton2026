import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuariorol } from './usuariorol.entity';
import { CreateUsuariorolDto } from './dto/create-usuariorol.dto';
import { UpdateUsuariorolDto } from './dto/update-usuariorol.dto';

const PRIMARY_KEYS = ["usuariorolId"];
const PRIMARY_KEY_TYPES: Record<string, 'number' | 'string' | 'boolean' | 'Date'> = {
  usuariorolId: 'number',
};

@Injectable()
export class UsuariorolService {
  constructor(
    @InjectRepository(Usuariorol)
    private readonly usuariorolRepository: Repository<Usuariorol>,
  ) {}

  create(payload: CreateUsuariorolDto): Promise<Usuariorol> {
    const entity = this.usuariorolRepository.create(payload as Partial<Usuariorol>);
    return this.usuariorolRepository.save(entity);
  }

  findAll(): Promise<Usuariorol[]> {
    return this.usuariorolRepository.find();
  }

  async findOne(id: string): Promise<Usuariorol> {
    const where = this.parseId(id);
    const entity = await this.usuariorolRepository.findOne({ where });
    if (!entity) {
      throw new NotFoundException(`registro ${id} no encontrado en usuariorol`);
    }
    return entity;
  }

  async update(id: string, payload: UpdateUsuariorolDto): Promise<Usuariorol> {
    const entity = await this.findOne(id);
    Object.assign(entity, payload);
    return this.usuariorolRepository.save(entity);
  }

  async remove(id: string): Promise<void> {
    const where = this.parseId(id);
    const result = await this.usuariorolRepository.delete(where);
    if (!result.affected) {
      throw new NotFoundException(`registro ${id} no encontrado en usuariorol`);
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
