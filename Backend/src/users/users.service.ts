import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Usuario } from './entities/user.entity';
import { createHash } from 'crypto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  async create(payload: CreateUserDto): Promise<Usuario> {
    try {
      const hashed = await bcrypt.hash(payload.password, 10);
      const fingerprintHash = this.hashFingerprint(payload.fingerprintTemplate);
      const entity = this.usuarioRepository.create({
        username: payload.username,
        pacienteId: payload.pacienteId,
        role: payload.role ?? 'paciente',
        activo: payload.activo ?? true,
        hashPassword: Buffer.from(hashed, 'utf8'),
        fingerprintHash,
      });
      return await this.usuarioRepository.save(entity);
    } catch (error) {
      return this.handleDbError(error, 'crear');
    }
  }

  findAll(): Promise<Usuario[]> {
    return this.usuarioRepository.find();
  }

  async findOne(id: number): Promise<Usuario> {
    const user = await this.usuarioRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`usuario ${id} no encontrado`);
    }
    return user;
  }

  async update(id: number, payload: UpdateUserDto): Promise<Usuario> {
    const user = await this.findOne(id);
    if (payload.username !== undefined) {
      user.username = payload.username;
    }
    if (payload.pacienteId !== undefined) {
      user.pacienteId = payload.pacienteId;
    }
    if (payload.role !== undefined) {
      user.role = payload.role;
    }
    if (payload.activo !== undefined) {
      user.activo = payload.activo;
    }
    if (payload.password) {
      const hashed = await bcrypt.hash(payload.password, 10);
      user.hashPassword = Buffer.from(hashed, 'utf8');
    }
    if (payload.fingerprintTemplate !== undefined) {
      user.fingerprintHash = this.hashFingerprint(payload.fingerprintTemplate);
    }
    if (payload.lastLogin !== undefined) {
      user.lastLogin = payload.lastLogin;
    }
    try {
      return await this.usuarioRepository.save(user);
    } catch (error) {
      return this.handleDbError(error, 'actualizar');
    }
  }

  async findByUsername(username: string): Promise<Usuario | null> {
    return this.usuarioRepository.findOne({ where: { username } });
  }

  async registerLogin(id: number): Promise<void> {
    await this.usuarioRepository.update(id, { lastLogin: new Date() });
  }

  async remove(id: number): Promise<void> {
    try {
      const result = await this.usuarioRepository.delete(id);
      if (!result.affected) {
        throw new NotFoundException(`usuario ${id} no encontrado`);
      }
    } catch (error) {
      this.handleDbError(error, 'eliminar');
    }
  }

  private handleDbError(error: unknown, action: string): never {
    if (error instanceof QueryFailedError) {
      const driverError = error.driverError as { number?: number; message?: string } | undefined;
      if (driverError?.number === 2627 || driverError?.number === 2601) {
        throw new BadRequestException('ya existe un registro con los mismos datos clave');
      }
      throw new InternalServerErrorException(
        `no se pudo ${action} el usuario por un error en la base de datos (${driverError?.message ?? 'sin detalle'})`,
      );
    }
    throw new InternalServerErrorException(`no se pudo ${action} el usuario`);
  }

  private hashFingerprint(template?: string): Buffer | undefined {
    if (!template) {
      return undefined;
    }
    try {
      const raw = Buffer.from(template, 'base64');
      if (!raw.length) {
        throw new Error('empty');
      }
      return createHash('sha256').update(raw).digest();
    } catch {
      throw new BadRequestException('huella digital invalida, envia una cadena base64 valida');
    }
  }
}
