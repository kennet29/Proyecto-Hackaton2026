import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthenticatedUser } from '../../auth/auth.service';
import { UsuarioPaciente } from './usuariopaciente.entity';
import { CreateUsuarioPacienteDto } from './dto/create-usuariopaciente.dto';
import { UpdateUsuarioPacienteDto } from './dto/update-usuariopaciente.dto';

@Injectable()
export class UsuarioPacienteService {
  constructor(
    @InjectRepository(UsuarioPaciente)
    private readonly usuarioPacienteRepository: Repository<UsuarioPaciente>,
  ) {}

  async link(
    actor: AuthenticatedUser,
    payload: CreateUsuarioPacienteDto,
  ): Promise<UsuarioPaciente> {
    const usuarioId = payload.usuarioId ?? actor.userId;
    if (!usuarioId) {
      throw new BadRequestException('no se pudo determinar el usuario objetivo');
    }
    if (actor.userId !== usuarioId && !this.isAdmin(actor)) {
      throw new ForbiddenException('no puedes registrar pacientes para otros usuarios');
    }
    const existing = await this.usuarioPacienteRepository.findOne({
      where: { usuarioId, pacienteId: payload.pacienteId },
    });
    if (existing) {
      throw new BadRequestException('ya existe la relacion usuario-paciente');
    }
    const relation = this.usuarioPacienteRepository.create({
      usuarioId,
      pacienteId: payload.pacienteId,
      parentesco: payload.parentesco ?? null,
      esPrincipal: payload.esPrincipal ?? false,
      notas: payload.notas ?? null,
      creadoPor: actor.username,
    });
    return this.usuarioPacienteRepository.save(relation);
  }

  async listMine(actor: AuthenticatedUser): Promise<UsuarioPaciente[]> {
    if (!actor.userId) {
      throw new BadRequestException('sesion invalida');
    }
    return this.usuarioPacienteRepository.find({
      where: { usuarioId: actor.userId },
      order: { creadoEn: 'DESC' },
    });
  }

  async update(
    id: number,
    payload: UpdateUsuarioPacienteDto,
    actor: AuthenticatedUser,
  ): Promise<UsuarioPaciente> {
    const relation = await this.usuarioPacienteRepository.findOne({ where: { id } });
    if (!relation) {
      throw new NotFoundException('relacion usuario-paciente no encontrada');
    }
    if (!this.isAdmin(actor) && relation.usuarioId !== actor.userId) {
      throw new ForbiddenException('no puedes actualizar esta relacion');
    }
    if (payload.parentesco !== undefined) {
      relation.parentesco = payload.parentesco ?? null;
    }
    if (payload.esPrincipal !== undefined) {
      relation.esPrincipal = payload.esPrincipal;
    }
    if (payload.notas !== undefined) {
      relation.notas = payload.notas ?? null;
    }
    relation.modificadoPor = actor.username;
    return this.usuarioPacienteRepository.save(relation);
  }

  async remove(id: number, actor: AuthenticatedUser): Promise<void> {
    const relation = await this.usuarioPacienteRepository.findOne({ where: { id } });
    if (!relation) {
      throw new NotFoundException('relacion usuario-paciente no encontrada');
    }
    if (!this.isAdmin(actor) && relation.usuarioId !== actor.userId) {
      throw new ForbiddenException('no puedes eliminar esta relacion');
    }
    await this.usuarioPacienteRepository.delete(id);
  }

  isAdmin(user: AuthenticatedUser): boolean {
    const role = user.role?.toLowerCase();
    return role === 'admin' || role === 'superadmin';
  }
}
