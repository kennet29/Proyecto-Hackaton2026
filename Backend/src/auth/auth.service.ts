import { Injectable, UnauthorizedException, NotFoundException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes, createHash, timingSafeEqual } from 'crypto';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RequestResetDto } from './dto/request-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { MailService } from '../mail/mail.service';
import { TokenRevocationService } from './token-revocation.service';
import { UsuarioPaciente } from '../modules/usuariopaciente/usuariopaciente.entity';

export interface AuthenticatedUser {
  userId: number;
  username: string;
  role?: string;
  pacienteId?: number | null;
  pacienteIds?: number[];
  tokenId?: string;
  exp?: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectRepository(PasswordResetToken)
    private readonly resetRepository: Repository<PasswordResetToken>,
    @InjectRepository(UsuarioPaciente)
    private readonly usuarioPacienteRepository: Repository<UsuarioPaciente>,
    private readonly mailService: MailService,
    private readonly tokenRevocationService: TokenRevocationService,
  ) {}

  async login(credentials: LoginDto) {
    const user = await this.usersService.findByUsername(credentials.username);
    if (!user) {
      throw new UnauthorizedException('credenciales invalidas');
    }
    const usedFingerprint = Boolean(credentials.fingerprintTemplate);
    if (usedFingerprint) {
      if (!user.fingerprintHash) {
        throw new UnauthorizedException('no hay una huella registrada para este usuario');
      }
      const providedHash = this.hashFingerprint(credentials.fingerprintTemplate!);
      const storedHash = user.fingerprintHash;
      if (
        !storedHash ||
        storedHash.length !== providedHash.length ||
        !timingSafeEqual(storedHash, providedHash)
      ) {
        throw new UnauthorizedException('huella digital no reconocida');
      }
    } else {
      const hash = user.hashPassword ? user.hashPassword.toString('utf8') : '';
      const isValid = await bcrypt.compare(credentials.password ?? '', hash);
      if (!isValid) {
        throw new UnauthorizedException('credenciales invalidas');
      }
    }
    await this.usersService.registerLogin(user.id);
    const linkedRelations = await this.usuarioPacienteRepository.find({
      where: { usuarioId: user.id },
      order: { esPrincipal: 'DESC', creadoEn: 'ASC' },
    });
    const linkedPacienteIds = Array.from(
      new Set(linkedRelations.map((relation) => relation.pacienteId)),
    );
    const preferredRelation = linkedRelations.find((relation) => relation.esPrincipal);
    const preferredPacienteId =
      user.pacienteId ??
      preferredRelation?.pacienteId ??
      linkedPacienteIds[0] ??
      null;
    const tokenId = randomBytes(16).toString('hex');
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      pacienteId: preferredPacienteId,
      pacienteIds: linkedPacienteIds,
    };
    const accessToken = await this.jwtService.signAsync(payload, { jwtid: tokenId });
    this.logger.log(`login exitoso para ${user.username} (id ${user.id})`);
    console.log(`login exitoso: usuario ${user.username} autenticado`);
    return {
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        pacienteId: preferredPacienteId,
        pacienteIds: linkedPacienteIds,
      },
    };
  }

  async logout(user: AuthenticatedUser) {
    if (!user.tokenId) {
      throw new UnauthorizedException('token sin identificador, vuelve a iniciar sesion');
    }
    const expiresAt =
      user.exp && user.exp > 0 ? new Date(user.exp * 1000) : new Date(Date.now() + 60 * 60 * 1000);
    await this.tokenRevocationService.revoke(user.tokenId, user.userId, expiresAt);
    return { message: 'sesion cerrada' };
  }

  async requestPasswordReset(payload: RequestResetDto) {
    const user = await this.usersService.findByUsername(payload.username);
    if (!user) {
      throw new NotFoundException('usuario no encontrado');
    }
    await this.resetRepository.update(
      { usuarioId: user.id, used: false },
      { used: true, usedOn: new Date() },
    );
    const tokenValue = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30);
    const entity = this.resetRepository.create({
      token: tokenValue,
      expiresAt,
      usuarioId: user.id,
    });
    await this.resetRepository.save(entity);
    const response = {
      message: 'token generado, usa este codigo para restablecer tu contrasena',
      token: tokenValue,
      expira: expiresAt.toISOString(),
    };
    const email = this.resolveUserEmail(user);
    if (email) {
      await this.mailService.sendPasswordResetMail(email, tokenValue, expiresAt);
    }
    return response;
  }

  async resetPassword(payload: ResetPasswordDto) {
    const record = await this.resetRepository.findOne({ where: { token: payload.token } });
    if (!record || record.used) {
      throw new UnauthorizedException('token invalido');
    }
    if (record.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('token expirado');
    }
    await this.usersService.update(record.usuarioId, { password: payload.password });
    record.used = true;
    record.usedOn = new Date();
    await this.resetRepository.save(record);
    return { message: 'contrasena actualizada' };
  }

  private resolveUserEmail(user: { username: string; creadoPor?: string }): string | null {
    if (user.username?.includes('@')) {
      return user.username;
    }
    if (user.creadoPor?.includes('@')) {
      return user.creadoPor;
    }
    return null;
  }

  private hashFingerprint(template: string): Buffer {
    try {
      const raw = Buffer.from(template, 'base64');
      if (!raw.length) {
        throw new Error('empty');
      }
      return createHash('sha256').update(raw).digest();
    } catch {
      throw new UnauthorizedException('huella digital invalida');
    }
  }
}
