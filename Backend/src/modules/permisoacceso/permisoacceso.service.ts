import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { UsersService } from '../../users/users.service';
import { AuthenticatedUser } from '../../auth/auth.service';
import { PermisoAcceso } from './permisoacceso.entity';
import { CreatePermisoAccesoDto, temporalDurations } from './dto/create-permisoacceso.dto';
import { PacienteAccessService } from '../../auth/paciente-access.service';
import { UpdatePermisoAccesoDto } from './dto/update-permisoacceso.dto';
import { PermisoAccesoToken } from './permisoacceso-token.entity';
import { CreatePermisoAccesoQrDto } from './dto/create-permisoacceso-qr.dto';
import { ClaimPermisoAccesoQrDto } from './dto/claim-permisoacceso-qr.dto';

const durationMap: Record<(typeof temporalDurations)[number], number> = {
  '15m': 15,
  '1h': 60,
  '1d': 60 * 24,
};

@Injectable()
export class PermisoaccesoService {
  constructor(
    @InjectRepository(PermisoAcceso)
    private readonly permisoRepository: Repository<PermisoAcceso>,
    @InjectRepository(PermisoAccesoToken)
    private readonly tokenRepository: Repository<PermisoAccesoToken>,
    private readonly usersService: UsersService,
    private readonly pacienteAccessService: PacienteAccessService,
    private readonly configService: ConfigService,
  ) {}

  async grant(
    pacienteId: number,
    payload: CreatePermisoAccesoDto,
    actor: AuthenticatedUser,
  ): Promise<PermisoAcceso> {
    await this.ensureActorControlsPaciente(actor, pacienteId);

    const medico = await this.usersService.findOne(payload.medicoId);
    if (medico.role?.toLowerCase() !== 'medico') {
      throw new BadRequestException('el usuario seleccionado no es un medico valido');
    }

    await this.deactivateExisting(pacienteId, payload.medicoId);

    const now = new Date();
    const permiso = this.permisoRepository.create({
      pacienteId,
      medicoId: payload.medicoId,
      tipo: payload.tipo,
      duracion: payload.tipo === 'temporal' ? payload.duracion ?? null : null,
      fechaInicio: now,
      fechaFin: payload.tipo === 'temporal' ? this.calculateEndDate(now, payload.duracion!) : null,
      estado: 'activo',
      notas: payload.notas ?? null,
      creadoPor: actor.username,
    });
    return this.permisoRepository.save(permiso);
  }

  async createQrToken(
    permisoId: number,
    payload: CreatePermisoAccesoQrDto,
    actor: AuthenticatedUser,
  ): Promise<{ token: string; expiresAt: Date; deepLink: string }> {
    const permiso = await this.permisoRepository.findOne({ where: { id: permisoId } });
    if (!permiso) {
      throw new NotFoundException('permiso no encontrado');
    }
    await this.ensureActorControlsPaciente(actor, permiso.pacienteId);
    if (permiso.estado !== 'activo') {
      throw new BadRequestException('solo los permisos activos pueden generar un QR');
    }
    if (permiso.fechaFin && permiso.fechaFin.getTime() < Date.now()) {
      throw new BadRequestException('el permiso ya expiro, crea uno nuevo');
    }
    const minutes = payload.duracionMinutos ?? 5;
    const expiresAt = new Date(Date.now() + minutes * 60 * 1000);
    const tokenValue = randomBytes(24).toString('hex');
    const record = this.tokenRepository.create({
      token: tokenValue,
      permisoId: permiso.id,
      expiresAt,
      used: false,
      creadoPor: actor.username,
    });
    await this.tokenRepository.save(record);
    const baseDeepLink =
      this.configService.get<string>('QR_DEEPLINK_BASE') ?? 'gestionsalud://permiso-acceso';
    const deepLink = `${baseDeepLink}?token=${encodeURIComponent(tokenValue)}`;
    return { token: tokenValue, expiresAt, deepLink };
  }

  async claimQrToken(
    payload: ClaimPermisoAccesoQrDto,
    actor: AuthenticatedUser,
  ): Promise<{ message: string; permisoId: number; pacienteId: number; expira?: Date | null }> {
    if (actor.role?.toLowerCase() !== 'medico') {
      throw new ForbiddenException('solo un medico puede reclamar un QR');
    }
    const record = await this.tokenRepository.findOne({
      where: { token: payload.token },
      relations: ['permiso'],
    });
    if (!record) {
      throw new NotFoundException('token no encontrado');
    }
    if (record.used) {
      throw new BadRequestException('este token ya fue utilizado');
    }
    if (record.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('el token ya expiro, solicita uno nuevo');
    }
    const permiso = record.permiso;
    if (permiso.medicoId !== actor.userId) {
      throw new ForbiddenException('este permiso no esta asignado a tu usuario');
    }
    if (permiso.estado !== 'activo') {
      throw new BadRequestException('el permiso ya no esta activo');
    }
    if (permiso.fechaFin && permiso.fechaFin.getTime() < Date.now()) {
      throw new BadRequestException('el permiso ya expiro');
    }
    record.used = true;
    record.usedBy = actor.userId;
    record.usedOn = new Date();
    await this.tokenRepository.save(record);
    return {
      message: 'permiso validado correctamente',
      permisoId: permiso.id,
      pacienteId: permiso.pacienteId,
      expira: permiso.fechaFin ?? null,
    };
  }

  async listForPaciente(pacienteId: number, actor: AuthenticatedUser): Promise<PermisoAcceso[]> {
    await this.ensureActorControlsPaciente(actor, pacienteId);
    const permisos = await this.permisoRepository.find({
      where: { pacienteId },
      order: { fechaInicio: 'DESC' },
    });
    return this.refreshStatuses(permisos);
  }

  async listForMedico(actor: AuthenticatedUser): Promise<PermisoAcceso[]> {
    if (actor.role?.toLowerCase() !== 'medico') {
      throw new ForbiddenException('solo un medico puede consultar estos permisos');
    }
    const permisos = await this.permisoRepository.find({
      where: { medicoId: actor.userId },
      order: { fechaInicio: 'DESC' },
    });
    return this.refreshStatuses(permisos);
  }

  async revoke(permisoId: number, actor: AuthenticatedUser): Promise<void> {
    const permiso = await this.permisoRepository.findOne({ where: { id: permisoId } });
    if (!permiso) {
      throw new NotFoundException('permiso no encontrado');
    }
    await this.ensureActorControlsPaciente(actor, permiso.pacienteId);
    if (permiso.estado !== 'revocado') {
      permiso.estado = 'revocado';
      permiso.fechaFin = permiso.fechaFin ?? new Date();
      permiso.modificadoPor = actor.username;
      await this.permisoRepository.save(permiso);
    }
  }

  async update(
    permisoId: number,
    payload: UpdatePermisoAccesoDto,
    actor: AuthenticatedUser,
  ): Promise<PermisoAcceso> {
    const permiso = await this.permisoRepository.findOne({ where: { id: permisoId } });
    if (!permiso) {
      throw new NotFoundException('permiso no encontrado');
    }
    await this.ensureActorControlsPaciente(actor, permiso.pacienteId);

    if (payload.tipo) {
      permiso.tipo = payload.tipo;
    }

    if (payload.notas !== undefined) {
      permiso.notas = payload.notas ?? null;
    }

    const nextTipo = permiso.tipo;
    if (nextTipo === 'temporal') {
      const durationValue = payload.duracion ?? permiso.duracion ?? null;
      if (!durationValue) {
        throw new BadRequestException('los permisos temporales requieren una duracion');
      }
      if (
        !temporalDurations.includes(
          durationValue as (typeof temporalDurations)[number],
        )
      ) {
        throw new BadRequestException('duracion temporal no valida');
      }
      const shouldRecalculate = payload.duracion !== undefined || payload.tipo === 'temporal';
      permiso.duracion = durationValue;
      if (shouldRecalculate) {
        const now = new Date();
        permiso.fechaInicio = now;
        permiso.fechaFin = this.calculateEndDate(
          now,
          durationValue as (typeof temporalDurations)[number],
        );
      }
    } else {
      permiso.duracion = null;
      permiso.fechaFin = null;
    }

    if (payload.estado) {
      if (payload.estado === 'revocado') {
        permiso.estado = 'revocado';
        permiso.fechaFin = permiso.fechaFin ?? new Date();
      } else if (payload.estado === 'activo') {
        if (permiso.fechaFin && permiso.fechaFin.getTime() < Date.now()) {
          throw new BadRequestException('no puedes reactivar un permiso expirado');
        }
        permiso.estado = 'activo';
      }
    }

    permiso.modificadoPor = actor.username;
    return this.permisoRepository.save(permiso);
  }

  private async ensureActorControlsPaciente(actor: AuthenticatedUser, pacienteId: number) {
    if (await this.pacienteAccessService.canManagePaciente(actor, pacienteId)) {
      return;
    }
    throw new ForbiddenException('no puedes gestionar permisos para este paciente');
  }

  private calculateEndDate(start: Date, duration: (typeof temporalDurations)[number]): Date {
    const minutes = durationMap[duration];
    const result = new Date(start);
    result.setMinutes(result.getMinutes() + minutes);
    return result;
  }

  private async deactivateExisting(pacienteId: number, medicoId: number): Promise<void> {
    await this.permisoRepository.update(
      { pacienteId, medicoId, estado: 'activo' },
      { estado: 'revocado', fechaFin: new Date() },
    );
  }

  private async refreshStatuses(permisos: PermisoAcceso[]): Promise<PermisoAcceso[]> {
    const now = Date.now();
    const expired = permisos.filter(
      (permiso) =>
        permiso.estado === 'activo' &&
        permiso.fechaFin &&
        permiso.fechaFin.getTime() < now,
    );
    if (expired.length) {
      for (const permiso of expired) {
        permiso.estado = 'expirado';
      }
      await this.permisoRepository.save(expired);
    }
    return permisos;
  }
}
