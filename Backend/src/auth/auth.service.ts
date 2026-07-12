import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { InjectRepository } from "@nestjs/typeorm";
import { randomBytes, randomInt, createHash, timingSafeEqual } from "crypto";
import { Repository } from "typeorm";
import { UsersService } from "../users/users.service";
import { LoginDto } from "./dto/login.dto";
import { RequestResetDto } from "./dto/request-reset.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { PasswordResetToken } from "./entities/password-reset-token.entity";
import { MailService } from "../mail/mail.service";
import { TokenRevocationService } from "./token-revocation.service";
import { UsuarioPaciente } from "../modules/usuariopaciente/usuariopaciente.entity";

/**
 * Describe el usuario autenticado que se inyecta en la solicitud actual.
 */
export interface AuthenticatedUser {
  /**
   * Identificador persistido para `userId`.
   */
  userId: number;
  /**
   * Campo de datos asociado a `username`.
   */
  username: string;
  /**
   * Campo de datos asociado a `role`.
   */
  role?: string;
  /**
   * Identificador persistido para `pacienteId`.
   */
  pacienteId?: number | null;
  /**
   * Campo de datos asociado a `pacienteIds`.
   */
  pacienteIds?: number[];
  /**
   * Identificador persistido para `tokenId`.
   */
  tokenId?: string;
  /**
   * Campo de datos asociado a `exp`.
   */
  exp?: number;
}

/**
 * Implementa la lógica de negocio y persistencia del dominio auth.
 */
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

  /**
   * Login.
   * @param credentials Credenciales enviadas por el cliente.
   * @returns Resultado de la operación.
   */
  async login(credentials: LoginDto) {
    const user = await this.usersService.findByUsername(credentials.username);
    if (!user) {
      throw new UnauthorizedException("credenciales invalidas");
    }
    const usedFingerprint = Boolean(credentials.fingerprintTemplate);
    if (usedFingerprint) {
      if (!user.fingerprintHash) {
        throw new UnauthorizedException(
          "no hay una huella registrada para este usuario",
        );
      }
      const providedHash = this.hashFingerprint(
        credentials.fingerprintTemplate!,
      );
      const storedHash = user.fingerprintHash;
      if (
        !storedHash ||
        storedHash.length !== providedHash.length ||
        !timingSafeEqual(storedHash, providedHash)
      ) {
        throw new UnauthorizedException("huella digital no reconocida");
      }
    } else {
      const hash = user.hashPassword ? user.hashPassword.toString("utf8") : "";
      const isValid = await bcrypt.compare(credentials.password ?? "", hash);
      if (!isValid) {
        throw new UnauthorizedException("credenciales invalidas");
      }
    }
    await this.usersService.registerLogin(user.id);
    const linkedRelations = await this.usuarioPacienteRepository.find({
      where: { usuarioId: user.id },
      order: { esPrincipal: "DESC", creadoEn: "ASC" },
    });
    const linkedPacienteIds = Array.from(
      new Set(linkedRelations.map((relation) => relation.pacienteId)),
    );
    const preferredRelation = linkedRelations.find(
      (relation) => relation.esPrincipal,
    );
    const preferredPacienteId =
      user.pacienteId ??
      preferredRelation?.pacienteId ??
      linkedPacienteIds[0] ??
      null;
    const tokenId = randomBytes(16).toString("hex");
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      pacienteId: preferredPacienteId,
      pacienteIds: linkedPacienteIds,
    };
    const accessToken = await this.jwtService.signAsync(payload, {
      jwtid: tokenId,
    });
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

  /**
   * Logout.
   * @param user Usuario autenticado asociado a la solicitud.
   * @returns Resultado de la operación.
   */
  async logout(user: AuthenticatedUser) {
    if (!user.tokenId) {
      throw new UnauthorizedException(
        "token sin identificador, vuelve a iniciar sesion",
      );
    }
    const expiresAt =
      user.exp && user.exp > 0
        ? new Date(user.exp * 1000)
        : new Date(Date.now() + 60 * 60 * 1000);
    await this.tokenRevocationService.revoke(
      user.tokenId,
      user.userId,
      expiresAt,
    );
    return { message: "sesion cerrada" };
  }

  /**
   * Request password reset.
   * @param payload Datos validados que recibe la operación.
   * @returns Resultado de la operación.
   */
  async requestPasswordReset(payload: RequestResetDto) {
    await this.validateCaptcha(payload.captchaToken, payload.captchaAnswer);
    const user =
      await this.usersService.findByUsernameOrEmail(payload.username);
    if (!user) {
      throw new NotFoundException("usuario no encontrado");
    }
    if (!user.securityQuestion || !user.securityAnswerHash) {
      throw new UnauthorizedException("la cuenta no tiene una pregunta de seguridad configurada");
    }
    const answerIsValid =
      user.securityQuestion === payload.securityQuestion &&
      (await bcrypt.compare(
        this.normalizeSecurityAnswer(payload.securityAnswer),
        user.securityAnswerHash,
      ));
    if (!answerIsValid) {
      throw new UnauthorizedException("respuesta de seguridad incorrecta");
    }
    await this.resetRepository.update(
      { usuarioId: user.id, used: false },
      { used: true, usedOn: new Date() },
    );
    const tokenValue = this.generateRecoveryCode();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30);
    const entity = this.resetRepository.create({
      token: tokenValue,
      expiresAt,
      usuarioId: user.id,
    });
    await this.resetRepository.save(entity);
    const response = {
      message: "codigo generado, usalo para restablecer tu contrasena",
      token: tokenValue,
      expira: expiresAt.toISOString(),
    };
    return response;
  }

  private generateRecoveryCode(): string {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return Array.from(
      { length: 4 },
      () => alphabet[randomInt(0, alphabet.length)],
    ).join("");
  }

  async createCaptcha() {
    const left = Math.floor(Math.random() * 9) + 1;
    const right = Math.floor(Math.random() * 9) + 1;
    const captchaToken = await this.jwtService.signAsync(
      { purpose: "password-reset-captcha", answer: String(left + right) },
      { expiresIn: "5m" },
    );
    return { question: `${left} + ${right} = ?`, captchaToken };
  }

  private async validateCaptcha(token: string, answer: string): Promise<void> {
    try {
      const payload = await this.jwtService.verifyAsync<{ purpose: string; answer: string }>(token);
      if (payload.purpose !== "password-reset-captcha" || payload.answer !== answer) {
        throw new Error("invalid");
      }
    } catch {
      throw new UnauthorizedException("captcha invalido o expirado");
    }
  }

  private normalizeSecurityAnswer(value: string): string {
    return value.trim().toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  /**
   * Reset password.
   * @param payload Datos validados que recibe la operación.
   * @returns Resultado de la operación.
   */
  async resetPassword(payload: ResetPasswordDto) {
    const record = await this.resetRepository.findOne({
      where: { token: payload.token },
    });
    if (!record || record.used) {
      throw new UnauthorizedException("token invalido");
    }
    if (record.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException("token expirado");
    }
    await this.usersService.update(record.usuarioId, {
      password: payload.password,
    });
    record.used = true;
    record.usedOn = new Date();
    await this.resetRepository.save(record);
    return { message: "contrasena actualizada" };
  }

  /**
   * Resuelve user email.
   * @param user Usuario autenticado asociado a la solicitud.
   * @returns Resultado de la operación.
   */
  private resolveUserEmail(user: {
    username: string;
    creadoPor?: string;
  }): string | null {
    if (user.username?.includes("@")) {
      return user.username;
    }
    if (user.creadoPor?.includes("@")) {
      return user.creadoPor;
    }
    return null;
  }

  /**
   * Hash fingerprint.
   * @param template Valor del parámetro `template`.
   * @returns Resultado de la operación.
   */
  private hashFingerprint(template: string): Buffer {
    try {
      const raw = Buffer.from(template, "base64");
      if (!raw.length) {
        throw new Error("empty");
      }
      return createHash("sha256").update(raw).digest();
    } catch {
      throw new UnauthorizedException("huella digital invalida");
    }
  }
}
