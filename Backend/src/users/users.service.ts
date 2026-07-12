import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { QueryFailedError, Repository } from "typeorm";
import * as bcrypt from "bcryptjs";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { Usuario } from "./entities/user.entity";
import { createHash } from "crypto";
import { isDatabaseUnavailable } from "../common/database/database-error.util";

/**
 * Implementa la lógica de negocio y persistencia del dominio users.
 */
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  async create(payload: CreateUserDto): Promise<Usuario> {
    return this.persistUser(
      payload,
      payload.role ?? "paciente",
      payload.activo ?? true,
    );
  }

  /**
   * Register public user.
   * @param payload Datos validados que recibe la operación.
   * @returns Resultado de la operación.
   */
  async registerPublicUser(payload: CreateUserDto): Promise<{
    message: string;
    user: Usuario;
  }> {
    const totalUsers = await this.getTotalUsers();
    const bootstrapMode = totalUsers === 0;
    const publicEnabled =
      this.configService
        .get<string>("ALLOW_PUBLIC_USER_REGISTRATION", "false")
        .toLowerCase() === "true";

    if (!bootstrapMode && !publicEnabled) {
      throw new ForbiddenException(
        "el registro publico esta deshabilitado, solicita a un administrador que cree la cuenta",
      );
    }

    const assignedRole = bootstrapMode ? "admin" : "paciente";
    const user = await this.persistUser(payload, assignedRole, true);
    return {
      message: bootstrapMode
        ? "usuario inicial creado con rol admin"
        : "cuenta creada correctamente",
      user,
    };
  }

  /**
   * Get registration status.
   * @returns Resultado de la consulta solicitada.
   */
  async getRegistrationStatus() {
    const totalUsers = await this.getTotalUsers();
    const publicEnabled =
      this.configService
        .get<string>("ALLOW_PUBLIC_USER_REGISTRATION", "false")
        .toLowerCase() === "true";

    return {
      bootstrapMode: totalUsers === 0,
      publicRegistrationEnabled: publicEnabled || totalUsers === 0,
      totalUsers,
    };
  }

  /**
   * Find all.
   * @returns Colección de registros encontrados.
   */
  findAll(): Promise<Usuario[]> {
    return this.usuarioRepository.find();
  }

  /**
   * Find one.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  async findOne(id: number): Promise<Usuario> {
    const user = await this.usuarioRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`usuario ${id} no encontrado`);
    }
    return user;
  }

  /**
   * Update.
   * @param id Identificador del registro objetivo.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro actualizado.
   */
  async update(id: number, payload: UpdateUserDto): Promise<Usuario> {
    const user = await this.findOne(id);
    if (payload.username !== undefined) {
      user.username = payload.username;
    }
    if (payload.pacienteId !== undefined) {
      user.pacienteId = payload.pacienteId;
    }
    if (payload.city !== undefined) {
      user.city = payload.city;
    }
    if (payload.country !== undefined) {
      user.country = payload.country;
    }
    if (payload.role !== undefined) {
      user.role = payload.role;
    }
    if (payload.activo !== undefined) {
      user.activo = payload.activo;
    }
    if (payload.password) {
      const hashed = await bcrypt.hash(payload.password, 10);
      user.hashPassword = Buffer.from(hashed, "utf8");
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
      return this.handleDbError(error, "actualizar");
    }
  }

  /**
   * Find by username.
   * @param username Valor del parámetro `username`.
   * @returns Resultado de la operación.
   */
  async findByUsername(username: string): Promise<Usuario | null> {
    try {
      return await this.usuarioRepository.findOne({ where: { username } });
    } catch (error) {
      return this.handleDbError(error, "consultar");
    }
  }

  /**
   * Find by username or email.
   * @param identifier Usuario o correo asociado a la cuenta.
   * @returns Resultado de la operacion.
   */
  async findByUsernameOrEmail(identifier: string): Promise<Usuario | null> {
    const value = identifier.trim();
    try {
      return await this.usuarioRepository.findOne({
        where: [{ username: value }, { creadoPor: value }],
      });
    } catch (error) {
      return this.handleDbError(error, "consultar");
    }
  }

  /**
   * Register login.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  async registerLogin(id: number): Promise<void> {
    try {
      await this.usuarioRepository.update(id, { lastLogin: new Date() });
    } catch (error) {
      this.handleDbError(error, "registrar ingreso");
    }
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  async remove(id: number): Promise<void> {
    try {
      const result = await this.usuarioRepository.delete(id);
      if (!result.affected) {
        throw new NotFoundException(`usuario ${id} no encontrado`);
      }
    } catch (error) {
      this.handleDbError(error, "eliminar");
    }
  }

  /**
   * Persist user.
   * @param payload Datos validados que recibe la operación.
   * @param role Valor del parámetro `role`.
   * @param activo Valor del parámetro `activo`.
   * @returns Resultado de la operación.
   */
  private async persistUser(
    payload: CreateUserDto,
    role: string,
    activo: boolean,
  ): Promise<Usuario> {
    try {
      const hashed = await bcrypt.hash(payload.password, 10);
      const fingerprintHash = this.hashFingerprint(payload.fingerprintTemplate);
      const securityAnswerHash = await bcrypt.hash(
        this.normalizeSecurityAnswer(payload.securityAnswer),
        10,
      );
      const entity = this.usuarioRepository.create({
        username: payload.username,
        creadoPor: payload.email,
        city: payload.city,
        country: payload.country,
        pacienteId: payload.pacienteId,
        role,
        activo,
        hashPassword: Buffer.from(hashed, "utf8"),
        fingerprintHash,
        securityQuestion: payload.securityQuestion,
        securityAnswerHash,
      });
      return await this.usuarioRepository.save(entity);
    } catch (error) {
      if (isDatabaseUnavailable(error)) {
        throw new ServiceUnavailableException(
          "la base de datos no esta disponible temporalmente, intenta nuevamente en unos minutos",
        );
      }
      return this.handleDbError(error, "crear");
    }
  }

  private normalizeSecurityAnswer(value: string): string {
    return value.trim().toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  /**
   * Get total users.
   * @returns Total de usuarios registrados.
   */
  private async getTotalUsers(): Promise<number> {
    try {
      return await this.usuarioRepository.count();
    } catch (error) {
      if (isDatabaseUnavailable(error)) {
        throw new ServiceUnavailableException(
          "la base de datos no esta disponible temporalmente, intenta nuevamente en unos minutos",
        );
      }
      throw error;
    }
  }

  /**
   * Handle db error.
   * @param error Error original que se está procesando.
   * @param action Valor del parámetro `action`.
   * @returns Resultado de la operación.
   */
  private handleDbError(error: unknown, action: string): never {
    if (isDatabaseUnavailable(error)) {
      throw new ServiceUnavailableException(
        "la base de datos no esta disponible temporalmente, intenta nuevamente en unos minutos",
      );
    }
    if (error instanceof QueryFailedError) {
      const driverError = error.driverError as
        | {
            /**
             * Campo de datos asociado a `number`.
             */
            number?: number; /**
             * Campo de datos asociado a `message`.
             */
            message?: string;
          }
        | undefined;
      if (driverError?.number === 2627 || driverError?.number === 2601) {
        throw new BadRequestException(
          "ya existe un registro con los mismos datos clave",
        );
      }
      throw new InternalServerErrorException(
        `no se pudo ${action} el usuario por un error en la base de datos (${driverError?.message ?? "sin detalle"})`,
      );
    }
    throw new InternalServerErrorException(`no se pudo ${action} el usuario`);
  }

  /**
   * Hash fingerprint.
   * @param template Valor del parámetro `template`.
   * @returns Resultado de la operación.
   */
  private hashFingerprint(template?: string): Buffer | undefined {
    if (!template) {
      return undefined;
    }
    try {
      const raw = Buffer.from(template, "base64");
      if (!raw.length) {
        throw new Error("empty");
      }
      return createHash("sha256").update(raw).digest();
    } catch {
      throw new BadRequestException(
        "huella digital invalida, envia una cadena base64 valida",
      );
    }
  }
}
