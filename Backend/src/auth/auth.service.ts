import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RequestResetDto } from './dto/request-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectRepository(PasswordResetToken)
    private readonly resetRepository: Repository<PasswordResetToken>,
    private readonly mailService: MailService,
  ) {}

  async login(credentials: LoginDto) {
    const user = await this.usersService.findByUsername(credentials.username);
    if (!user) {
      throw new UnauthorizedException('credenciales invalidas');
    }
    const hash = user.hashPassword ? user.hashPassword.toString('utf8') : '';
    const isValid = await bcrypt.compare(credentials.password, hash);
    if (!isValid) {
      throw new UnauthorizedException('credenciales invalidas');
    }
    await this.usersService.registerLogin(user.id);
    const payload = { sub: user.id, username: user.username, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload);
    return {
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        pacienteId: user.pacienteId ?? null,
      },
    };
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
}
