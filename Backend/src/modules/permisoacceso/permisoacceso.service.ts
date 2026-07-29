import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { createHmac, randomBytes, randomInt, timingSafeEqual } from "crypto";
import { DataSource, Repository } from "typeorm";
import { AuthenticatedUser } from "../../auth/auth.service";
import { PacienteAccessService } from "../../auth/paciente-access.service";
import { UsersService } from "../../users/users.service";
import { ConsultamedicaService } from "../consultamedica/consultamedica.service";
import { ExamenclinicoService } from "../examenclinico/examenclinico.service";
import { PacienteService } from "../paciente/paciente.service";
import { PeriodoService } from "../periodo/periodo.service";
import { SaludmentalService } from "../saludmental/saludmental.service";
import { SeguimientofisicoService } from "../seguimientofisico/seguimientofisico.service";
import { SeguimientoposteventoService } from "../seguimientopostevento/seguimientopostevento.service";
import {
  CreatePermisoAccesoDto,
  temporalDurations,
} from "./dto/create-permisoacceso.dto";
import {
  CreatePermisoAccesoLinkDto,
  shareableSections,
} from "./dto/create-permisoacceso-link.dto";
import { CreatePermisoAccesoQrDto } from "./dto/create-permisoacceso-qr.dto";
import { ClaimPermisoAccesoQrDto } from "./dto/claim-permisoacceso-qr.dto";
import { CreatePermisoAccesoCodeDto } from "./dto/create-permisoacceso-code.dto";
import { ClaimPermisoAccesoCodeDto } from "./dto/claim-permisoacceso-code.dto";
import { UpdatePermisoAccesoDto } from "./dto/update-permisoacceso.dto";
import { PermisoAcceso } from "./permisoacceso.entity";
import { PermisoAccesoToken } from "./permisoacceso-token.entity";

const durationMap: Record<(typeof temporalDurations)[number], number> = {
  "15m": 15,
  "1h": 60,
  "1d": 60 * 24,
};

type ShareSection = (typeof shareableSections)[number];

type ShareTokenPayload = {
  permisoId: number;
  pacienteId: number;
  medicoId: number;
  secciones: ShareSection[];
  expiraEn: number;
};

const rawShareSectionMap: Partial<Record<ShareSection, string>> = {
  alergias: "alergia",
  antecedentesFamiliares: "antecedentefamiliar",
  citasMedicas: "citamedica",
  condicionesCronicas: "condicioncronica",
  desparasitaciones: "desparasitacion",
  documentosClinicos: "documentoclinico",
  embarazos: "embarazo",
  estiloVida: "estilovida",
  evaluacionesHabitos: "evaluacionsaludhabito",
  habitosEspecificos: "habitoespecifico",
  lesiones: "lesion",
  medicaciones: "medicacion",
  notificaciones: "notificacion",
  operaciones: "operacion",
  puntajesRiesgo: "puntajeriesgo",
  recordatoriosCitas: "recordatoriocita",
  registroDental: "registrodental",
  registrosMenstruales: "registromensual",
  vacunas: "vacuna",
};

/**
 * Implementa la lÃ³gica de negocio y persistencia del dominio permisoacceso.
 */
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
    private readonly dataSource: DataSource,
    private readonly pacienteService: PacienteService,
    private readonly consultamedicaService: ConsultamedicaService,
    private readonly saludmentalService: SaludmentalService,
    private readonly periodoService: PeriodoService,
    private readonly seguimientoFisicoService: SeguimientofisicoService,
    private readonly seguimientoPosteventoService: SeguimientoposteventoService,
    private readonly examenclinicoService: ExamenclinicoService,
  ) {}

  /**
   * Grant.
   * @param pacienteId Identificador asociado a paciente.
   * @param payload Datos validados que recibe la operaciÃ³n.
   * @param actor Valor del parÃ¡metro `actor`.
   * @returns Resultado de la operaciÃ³n.
   */
  async grant(
    pacienteId: number,
    payload: CreatePermisoAccesoDto,
    actor: AuthenticatedUser,
  ): Promise<PermisoAcceso> {
    await this.ensureActorControlsPaciente(actor, pacienteId);

    const medico = await this.usersService.findOne(payload.medicoId);
    if (medico.role?.toLowerCase() !== "medico") {
      throw new BadRequestException(
        "el usuario seleccionado no es un medico valido",
      );
    }

    await this.deactivateExisting(pacienteId, payload.medicoId);

    const now = new Date();
    const permiso = this.permisoRepository.create({
      pacienteId,
      medicoId: payload.medicoId,
      tipo: payload.tipo,
      duracion: payload.tipo === "temporal" ? (payload.duracion ?? null) : null,
      fechaInicio: now,
      fechaFin:
        payload.tipo === "temporal"
          ? this.calculateEndDate(now, payload.duracion!)
          : null,
      estado: "activo",
      notas: payload.notas ?? null,
      creadoPor: actor.username,
    });
    return this.permisoRepository.save(permiso);
  }

  async createAccessCode(
    pacienteId: number,
    payload: CreatePermisoAccesoCodeDto,
    actor: AuthenticatedUser,
  ): Promise<{
    code: string;
    expiresAt: Date;
    permisoId: number;
    pacienteId: number;
  }> {
    await this.ensureActorControlsPaciente(actor, pacienteId);
    await this.invalidatePendingAccessCodes(pacienteId, actor.username);
    const now = new Date();
    const codeExpiresAt = new Date(now.getTime() + 60 * 60 * 1000);
    const permiso = await this.permisoRepository.save(
      this.permisoRepository.create({
        pacienteId,
        medicoId: actor.userId,
        tipo: "temporal",
        duracion: "1h",
        fechaInicio: now,
        fechaFin: codeExpiresAt,
        estado: "revocado",
        notas: payload.notas ?? null,
        creadoPor: actor.username,
      }),
    );
    const code = await this.generateUniqueSixDigitCode();
    await this.tokenRepository.save(
      this.tokenRepository.create({
        token: code,
        permisoId: permiso.id,
        expiresAt: codeExpiresAt,
        used: false,
        creadoPor: actor.username,
      }),
    );
    return {
      code,
      expiresAt: codeExpiresAt,
      permisoId: permiso.id,
      pacienteId,
    };
  }

  /**
   * Create qr token.
   * @param permisoId Identificador asociado a permiso.
   * @param payload Datos validados que recibe la operaciÃ³n.
   * @param actor Valor del parÃ¡metro `actor`.
   * @returns Registro creado.
   */
  async createQrToken(
    permisoId: number,
    payload: CreatePermisoAccesoQrDto,
    actor: AuthenticatedUser,
  ): Promise<{
    token: string;
    expiresAt: Date;
    deepLink: string;
  }> {
    const permiso = await this.permisoRepository.findOne({
      where: { id: permisoId },
    });
    if (!permiso) {
      throw new NotFoundException("permiso no encontrado");
    }
    await this.ensureActorControlsPaciente(actor, permiso.pacienteId);
    if (permiso.estado !== "activo") {
      throw new BadRequestException(
        "solo los permisos activos pueden generar un QR",
      );
    }
    if (permiso.fechaFin && permiso.fechaFin.getTime() < Date.now()) {
      throw new BadRequestException("el permiso ya expiro, crea uno nuevo");
    }
    const minutes = payload.duracionMinutos ?? 5;
    const expiresAt = new Date(Date.now() + minutes * 60 * 1000);
    const tokenValue = randomBytes(24).toString("hex");
    const record = this.tokenRepository.create({
      token: tokenValue,
      permisoId: permiso.id,
      expiresAt,
      used: false,
      creadoPor: actor.username,
    });
    await this.tokenRepository.save(record);
    const baseDeepLink =
      this.configService.get<string>("QR_DEEPLINK_BASE") ??
      "gestionsalud://permiso-acceso";
    const deepLink = `${baseDeepLink}?token=${encodeURIComponent(tokenValue)}`;
    return { token: tokenValue, expiresAt, deepLink };
  }

  /**
   * Create share link.
   * @param permisoId Identificador asociado a permiso.
   * @param payload Datos validados que recibe la operaciÃ³n.
   * @param actor Valor del parÃ¡metro `actor`.
   * @returns Resultado de la operaciÃ³n.
   */
  async createShareLink(
    permisoId: number,
    payload: CreatePermisoAccesoLinkDto,
    actor: AuthenticatedUser,
  ): Promise<{
    token: string;
    expiresAt: Date;
    shareUrl: string;
    permisoId: number;
    pacienteId: number;
    medicoId: number;
    secciones: ShareSection[];
  }> {
    const permiso = await this.permisoRepository.findOne({
      where: { id: permisoId },
    });
    if (!permiso) {
      throw new NotFoundException("permiso no encontrado");
    }

    await this.ensureActorControlsPaciente(actor, permiso.pacienteId);
    await this.ensurePermisoActivo(
      permiso,
      "el permiso ya expiro, crea uno nuevo antes de compartir",
    );

    const requestedExpiresAt = new Date(
      Date.now() + payload.duracionMinutos * 60 * 1000,
    );
    const expiresAt =
      permiso.fechaFin && permiso.fechaFin.getTime() < requestedExpiresAt.getTime()
        ? permiso.fechaFin
        : requestedExpiresAt;
    const secciones = payload.secciones as ShareSection[];
    const token = this.signShareToken({
      permisoId: permiso.id,
      pacienteId: permiso.pacienteId,
      medicoId: permiso.medicoId,
      secciones,
      expiraEn: expiresAt.getTime(),
    });
    const baseShareLink = (
      this.configService.get<string>("SHARE_LINK_BASE") ??
      "http://localhost:3010/api/v1/permiso-acceso/compartido"
    ).replace(/\/+$/, "");
    const shareUrl = `${baseShareLink}/${encodeURIComponent(token)}`;

    return {
      token,
      expiresAt,
      shareUrl,
      permisoId: permiso.id,
      pacienteId: permiso.pacienteId,
      medicoId: permiso.medicoId,
      secciones,
    };
  }

  /**
   * Resolve share link.
   * @param token Token firmado del enlace compartido.
   * @returns JSON con los datos compartidos.
   */
  async resolveShareLink(token: string) {
    const payload = this.verifyShareToken(token);
    const permiso = await this.permisoRepository.findOne({
      where: { id: payload.permisoId },
    });
    if (!permiso) {
      throw new NotFoundException("el permiso asociado al enlace no existe");
    }
    if (
      permiso.pacienteId !== payload.pacienteId ||
      permiso.medicoId !== payload.medicoId
    ) {
      throw new ForbiddenException("el enlace compartido ya no es valido");
    }

    await this.ensurePermisoActivo(
      permiso,
      "el permiso del paciente ya expiro o fue revocado",
    );

    const allowedSections = await this.getAllowedShareSections(
      payload.pacienteId,
      payload.secciones,
    );
    const data = await this.buildSharedData(
      payload.pacienteId,
      allowedSections,
    );

    return {
      generatedAt: new Date().toISOString(),
      expiresAt: new Date(payload.expiraEn).toISOString(),
      permiso: {
        permisoId: permiso.id,
        pacienteId: permiso.pacienteId,
        medicoId: permiso.medicoId,
        tipo: permiso.tipo,
        estado: permiso.estado,
        fechaInicio: permiso.fechaInicio.toISOString(),
        fechaFin: permiso.fechaFin ? permiso.fechaFin.toISOString() : null,
        notas: permiso.notas ?? null,
      },
      secciones: allowedSections,
      data,
    };
  }

  /**
   * Claim qr token.
   * @param payload Datos validados que recibe la operaciÃ³n.
   * @param actor Valor del parÃ¡metro `actor`.
   * @returns Resultado de la operaciÃ³n.
   */
  async claimQrToken(
    payload: ClaimPermisoAccesoQrDto,
    actor: AuthenticatedUser,
  ): Promise<{
    message: string;
    permisoId: number;
    pacienteId: number;
    expira?: Date | null;
  }> {
    if (actor.role?.toLowerCase() !== "medico") {
      throw new ForbiddenException("solo un medico puede reclamar un QR");
    }
    const record = await this.tokenRepository.findOne({
      where: { token: payload.token },
      relations: ["permiso"],
    });
    if (!record) {
      throw new NotFoundException("token no encontrado");
    }
    if (record.used) {
      throw new BadRequestException("este token ya fue utilizado");
    }
    if (record.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException("el token ya expiro, solicita uno nuevo");
    }
    const permiso = record.permiso;
    if (permiso.medicoId !== actor.userId) {
      throw new ForbiddenException(
        "este permiso no esta asignado a tu usuario",
      );
    }
    if (permiso.estado !== "activo") {
      throw new BadRequestException("el permiso ya no esta activo");
    }
    if (permiso.fechaFin && permiso.fechaFin.getTime() < Date.now()) {
      throw new BadRequestException("el permiso ya expiro");
    }
    record.used = true;
    record.usedBy = actor.userId;
    record.usedOn = new Date();
    await this.tokenRepository.save(record);
    return {
      message: "permiso validado correctamente",
      permisoId: permiso.id,
      pacienteId: permiso.pacienteId,
      expira: permiso.fechaFin ?? null,
    };
  }

  async claimAccessCode(
    payload: ClaimPermisoAccesoCodeDto,
    actor: AuthenticatedUser,
  ): Promise<{
    message: string;
    permisoId: number;
    pacienteId: number;
    expira: Date;
  }> {
    if (actor.role?.toLowerCase() !== "medico") {
      throw new ForbiddenException(
        "solo un medico puede utilizar un codigo temporal",
      );
    }
    const record = await this.tokenRepository.findOne({
      where: { token: payload.code },
      relations: ["permiso"],
    });
    if (!record) {
      throw new NotFoundException("codigo no encontrado");
    }
    if (record.used) {
      throw new BadRequestException("este codigo ya fue utilizado");
    }
    if (record.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException("el codigo ya expiro, solicita uno nuevo");
    }
    const permiso = record.permiso;
    if (permiso.estado !== "revocado") {
      throw new BadRequestException("el codigo ya no esta disponible");
    }

    const accessStartsAt = new Date();
    const accessExpiresAt = new Date(accessStartsAt.getTime() + 60 * 60 * 1000);
    await this.deactivateExisting(permiso.pacienteId, actor.userId);
    permiso.medicoId = actor.userId;
    permiso.estado = "activo";
    permiso.fechaInicio = accessStartsAt;
    permiso.fechaFin = accessExpiresAt;
    permiso.duracion = "1h";
    permiso.modificadoPor = actor.username;
    record.used = true;
    record.usedBy = actor.userId;
    record.usedOn = accessStartsAt;
    await this.dataSource.transaction(async (manager) => {
      await manager.save(permiso);
      await manager.save(record);
    });
    return {
      message: "codigo validado y acceso temporal activado",
      permisoId: permiso.id,
      pacienteId: permiso.pacienteId,
      expira: accessExpiresAt,
    };
  }

  async getFullHistoryForDoctor(
    pacienteId: number,
    actor: AuthenticatedUser,
  ) {
    if (actor.role?.toLowerCase() !== "medico") {
      throw new ForbiddenException(
        "solo un medico puede consultar el historial temporal",
      );
    }
    await this.pacienteAccessService.assertAccess(actor, pacienteId);
    const permiso = await this.permisoRepository.findOne({
      where: {
        pacienteId,
        medicoId: actor.userId,
        estado: "activo",
      },
      order: { fechaInicio: "DESC" },
    });
    if (!permiso) {
      throw new ForbiddenException("no existe un permiso temporal activo");
    }
    await this.ensurePermisoActivo(
      permiso,
      "el acceso temporal al historial ya expiro",
    );
    const allowedSections = await this.getAllowedShareSections(
      pacienteId,
      [...shareableSections],
    );
    return {
      generatedAt: new Date().toISOString(),
      expiresAt: permiso.fechaFin?.toISOString() ?? null,
      permiso: {
        permisoId: permiso.id,
        pacienteId,
        medicoId: actor.userId,
        estado: permiso.estado,
        fechaInicio: permiso.fechaInicio.toISOString(),
        fechaFin: permiso.fechaFin?.toISOString() ?? null,
        notas: permiso.notas ?? null,
      },
      secciones: allowedSections,
      data: await this.buildSharedData(pacienteId, allowedSections),
    };
  }

  /**
   * List for paciente.
   * @param pacienteId Identificador asociado a paciente.
   * @param actor Valor del parÃ¡metro `actor`.
   * @returns Resultado de la operaciÃ³n.
   */
  async listForPaciente(
    pacienteId: number,
    actor: AuthenticatedUser,
  ): Promise<PermisoAcceso[]> {
    await this.ensureActorControlsPaciente(actor, pacienteId);
    const permisos = await this.permisoRepository.find({
      where: { pacienteId },
      order: { fechaInicio: "DESC" },
    });
    return this.refreshStatuses(permisos);
  }

  /**
   * List for medico.
   * @param actor Valor del parÃ¡metro `actor`.
   * @returns Resultado de la operaciÃ³n.
   */
  async listForMedico(actor: AuthenticatedUser): Promise<PermisoAcceso[]> {
    if (actor.role?.toLowerCase() !== "medico") {
      throw new ForbiddenException(
        "solo un medico puede consultar estos permisos",
      );
    }
    const permisos = await this.permisoRepository.find({
      where: { medicoId: actor.userId },
      order: { fechaInicio: "DESC" },
    });
    return this.refreshStatuses(permisos);
  }

  /**
   * Revoke.
   * @param permisoId Identificador asociado a permiso.
   * @param actor Valor del parÃ¡metro `actor`.
   * @returns La operaciÃ³n se completa sin devolver contenido.
   */
  async revoke(permisoId: number, actor: AuthenticatedUser): Promise<void> {
    const permiso = await this.permisoRepository.findOne({
      where: { id: permisoId },
    });
    if (!permiso) {
      throw new NotFoundException("permiso no encontrado");
    }
    await this.ensureActorControlsPaciente(actor, permiso.pacienteId);
    if (permiso.estado !== "revocado") {
      permiso.estado = "revocado";
      permiso.fechaFin = permiso.fechaFin ?? new Date();
      permiso.modificadoPor = actor.username;
      await this.permisoRepository.save(permiso);
    }
  }

  /**
   * Update.
   * @param permisoId Identificador asociado a permiso.
   * @param payload Datos validados que recibe la operaciÃ³n.
   * @param actor Valor del parÃ¡metro `actor`.
   * @returns Registro actualizado.
   */
  async update(
    permisoId: number,
    payload: UpdatePermisoAccesoDto,
    actor: AuthenticatedUser,
  ): Promise<PermisoAcceso> {
    const permiso = await this.permisoRepository.findOne({
      where: { id: permisoId },
    });
    if (!permiso) {
      throw new NotFoundException("permiso no encontrado");
    }
    await this.ensureActorControlsPaciente(actor, permiso.pacienteId);

    if (payload.tipo) {
      permiso.tipo = payload.tipo;
    }

    if (payload.notas !== undefined) {
      permiso.notas = payload.notas ?? null;
    }

    const nextTipo = permiso.tipo;
    if (nextTipo === "temporal") {
      const durationValue = payload.duracion ?? permiso.duracion ?? null;
      if (!durationValue) {
        throw new BadRequestException(
          "los permisos temporales requieren una duracion",
        );
      }
      if (
        !temporalDurations.includes(
          durationValue as (typeof temporalDurations)[number],
        )
      ) {
        throw new BadRequestException("duracion temporal no valida");
      }
      const shouldRecalculate =
        payload.duracion !== undefined || payload.tipo === "temporal";
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
      if (payload.estado === "revocado") {
        permiso.estado = "revocado";
        permiso.fechaFin = permiso.fechaFin ?? new Date();
      } else if (payload.estado === "activo") {
        if (permiso.fechaFin && permiso.fechaFin.getTime() < Date.now()) {
          throw new BadRequestException(
            "no puedes reactivar un permiso expirado",
          );
        }
        permiso.estado = "activo";
      }
    }

    permiso.modificadoPor = actor.username;
    return this.permisoRepository.save(permiso);
  }

  /**
   * Ensure actor controls paciente.
   * @param actor Valor del parÃ¡metro `actor`.
   * @param pacienteId Identificador asociado a paciente.
   * @returns Resultado de la operaciÃ³n.
   */
  private async ensureActorControlsPaciente(
    actor: AuthenticatedUser,
    pacienteId: number,
  ) {
    if (await this.pacienteAccessService.canManagePaciente(actor, pacienteId)) {
      return;
    }
    throw new ForbiddenException(
      "no puedes gestionar permisos para este paciente",
    );
  }

  /**
   * Calculate end date.
   * @param start Valor del parÃ¡metro `start`.
   * @param duration Valor del parÃ¡metro `duration`.
   * @returns Resultado de la operaciÃ³n.
   */
  private calculateEndDate(
    start: Date,
    duration: (typeof temporalDurations)[number],
  ): Date {
    const minutes = durationMap[duration];
    const result = new Date(start);
    result.setMinutes(result.getMinutes() + minutes);
    return result;
  }

  /**
   * Deactivate existing.
   * @param pacienteId Identificador asociado a paciente.
   * @param medicoId Identificador asociado a medico.
   * @returns La operaciÃ³n se completa sin devolver contenido.
   */
  private async deactivateExisting(
    pacienteId: number,
    medicoId: number,
  ): Promise<void> {
    await this.permisoRepository.update(
      { pacienteId, medicoId, estado: "activo" },
      { estado: "revocado", fechaFin: new Date() },
    );
  }

  private async generateUniqueSixDigitCode(): Promise<string> {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const code = String(randomInt(100000, 1000000));
      const existing = await this.tokenRepository.findOne({
        where: { token: code },
      });
      if (!existing) return code;
    }
    throw new BadRequestException(
      "no se pudo generar un codigo unico, intenta nuevamente",
    );
  }

  private async invalidatePendingAccessCodes(
    pacienteId: number,
    username: string,
  ): Promise<void> {
    const unusedTokens = await this.tokenRepository.find({
      where: { used: false },
      relations: ["permiso"],
    });
    const pendingTokens = unusedTokens.filter(
      (record) =>
        /^\d{6}$/.test(record.token) &&
        record.permiso?.pacienteId === pacienteId &&
        record.permiso?.creadoPor === username &&
        record.permiso?.estado === "revocado",
    );
    if (!pendingTokens.length) return;
    const now = new Date();
    for (const record of pendingTokens) {
      record.used = true;
      record.usedOn = now;
      record.permiso.fechaFin = now;
    }
    await this.dataSource.transaction(async (manager) => {
      await manager.save(pendingTokens.map((record) => record.permiso));
      await manager.save(pendingTokens);
    });
  }

  /**
   * Refresh statuses.
   * @param permisos Valor del parÃ¡metro `permisos`.
   * @returns Resultado de la operaciÃ³n.
   */
  private async refreshStatuses(
    permisos: PermisoAcceso[],
  ): Promise<PermisoAcceso[]> {
    const now = Date.now();
    const expired = permisos.filter(
      (permiso) =>
        permiso.estado === "activo" &&
        permiso.fechaFin &&
        permiso.fechaFin.getTime() < now,
    );
    if (expired.length) {
      for (const permiso of expired) {
        permiso.estado = "expirado";
      }
      await this.permisoRepository.save(expired);
    }
    return permisos;
  }

  /**
   * Ensure permiso activo.
   * @param permiso Permiso que se debe validar.
   * @param expiredMessage Mensaje usado al expirar.
   * @returns Resultado de la operaciÃ³n.
   */
  private async ensurePermisoActivo(
    permiso: PermisoAcceso,
    expiredMessage: string,
  ): Promise<void> {
    if (permiso.estado !== "activo") {
      throw new ForbiddenException("el permiso ya no esta activo");
    }
    if (permiso.fechaFin && permiso.fechaFin.getTime() < Date.now()) {
      permiso.estado = "expirado";
      await this.permisoRepository.save(permiso);
      throw new ForbiddenException(expiredMessage);
    }
  }

  /**
   * Sign share token.
   * @param payload Datos internos del enlace.
   * @returns Token firmado.
   */
  private signShareToken(payload: ShareTokenPayload): string {
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
      "base64url",
    );
    const signature = createHmac("sha256", this.getShareLinkSecret())
      .update(encodedPayload)
      .digest("base64url");
    return `${encodedPayload}.${signature}`;
  }

  /**
   * Verify share token.
   * @param token Token a validar.
   * @returns Payload interno validado.
   */
  private verifyShareToken(token: string): ShareTokenPayload {
    const [encodedPayload, signature] = token.split(".");
    if (!encodedPayload || !signature) {
      throw new BadRequestException("enlace compartido invalido");
    }

    const expectedSignature = createHmac("sha256", this.getShareLinkSecret())
      .update(encodedPayload)
      .digest("base64url");
    const providedBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);
    if (
      providedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(providedBuffer, expectedBuffer)
    ) {
      throw new ForbiddenException("la firma del enlace compartido no es valida");
    }

    let payload: unknown;
    try {
      payload = JSON.parse(
        Buffer.from(encodedPayload, "base64url").toString("utf8"),
      );
    } catch {
      throw new BadRequestException("no se pudo interpretar el enlace compartido");
    }

    if (!this.isShareTokenPayload(payload)) {
      throw new BadRequestException("el enlace compartido no tiene un formato valido");
    }
    if (payload.expiraEn < Date.now()) {
      throw new ForbiddenException("el enlace compartido ya expiro");
    }

    return payload;
  }

  /**
   * Get share link secret.
   * @returns Secreto utilizado para firma.
   */
  private getShareLinkSecret(): string {
    return (
      this.configService.get<string>("SHARE_LINK_SECRET") ??
      this.configService.get<string>("JWT_SECRET", "dev-secret")
    );
  }

  /**
   * Valida el payload interno del enlace.
   * @param value Valor a validar.
   * @returns Indicador de validez.
   */
  private isShareTokenPayload(value: unknown): value is ShareTokenPayload {
    if (!value || typeof value !== "object") {
      return false;
    }
    const candidate = value as Partial<ShareTokenPayload>;
    return (
      typeof candidate.permisoId === "number" &&
      typeof candidate.pacienteId === "number" &&
      typeof candidate.medicoId === "number" &&
      typeof candidate.expiraEn === "number" &&
      Array.isArray(candidate.secciones) &&
      candidate.secciones.every((section) =>
        shareableSections.includes(section as ShareSection),
      )
    );
  }

  /**
   * Build shared data.
   * @param pacienteId Identificador asociado a paciente.
   * @param secciones Secciones solicitadas.
   * @returns Resultado de la operaciÃ³n.
   */
  private async buildSharedData(
    pacienteId: number,
    secciones: ShareSection[],
  ): Promise<Record<string, unknown>> {
    const entries = await Promise.all(
      secciones.map(async (section) => {
        return [section, await this.getSectionData(pacienteId, section)] as const;
      }),
    );
    return Object.fromEntries(entries);
  }

  private async getAllowedShareSections(
    pacienteId: number,
    sections: ShareSection[],
  ): Promise<ShareSection[]> {
    if (!sections.includes("periodo")) return sections;
    const paciente = await this.pacienteService.findOne(String(pacienteId));
    const sexo = paciente.sexo?.trim().toUpperCase();
    return sexo === "F"
      ? sections
      : sections.filter((section) => section !== "periodo");
  }

  /**
   * Get section data.
   * @param pacienteId Identificador asociado a paciente.
   * @param section SecciÃ³n seleccionada.
   * @returns Datos serializables para la secciÃ³n.
   */
  private async getSectionData(pacienteId: number, section: ShareSection) {
    switch (section) {
      case "resumenClinico":
        return this.normalizeForJson(
          await this.pacienteService.getClinicalSummary(pacienteId),
        );
      case "consultasMedicas":
        return this.normalizeForJson(
          await this.consultamedicaService.findAllByPaciente(pacienteId),
        );
      case "saludMental":
        return this.normalizeForJson({
          historial: await this.saludmentalService.getHistorial(pacienteId),
          estadisticas: await this.saludmentalService.getEstadisticas(pacienteId),
          alertas: await this.saludmentalService.getAlertas(pacienteId),
        });
      case "periodo":
        return this.normalizeForJson({
          historial: await this.periodoService.getHistorial(pacienteId),
          prediccion: await this.periodoService.getPrediction(pacienteId),
          reporteMedico: await this.periodoService.getMedicalReport(pacienteId),
        });
      case "seguimientoFisico":
        return this.normalizeForJson({
          historial: await this.seguimientoFisicoService.getHistorial(pacienteId),
          resumen: await this.seguimientoFisicoService.getResumen(pacienteId),
          progresoPeso:
            await this.seguimientoFisicoService.getPesoProgress(pacienteId),
          logros: await this.seguimientoFisicoService.getLogros(pacienteId),
        });
      case "seguimientoPostevento":
        return this.normalizeForJson({
          historial:
            await this.seguimientoPosteventoService.getHistorial(pacienteId),
          compartidosConMedico:
            await this.seguimientoPosteventoService.getCompartidosConMedico(
              pacienteId,
            ),
        });
      case "examenesClinicos":
        return this.normalizeForJson(
          await this.examenclinicoService.findAll(pacienteId),
        );
      default:
        return this.findRawSectionData(pacienteId, section);
    }
  }

  /**
   * Find raw section data.
   * @param pacienteId Identificador asociado a paciente.
   * @param section SecciÃ³n seleccionada.
   * @returns Resultado serializable.
   */
  private async findRawSectionData(
    pacienteId: number,
    section: ShareSection,
  ) {
    const tableName = rawShareSectionMap[section];
    if (!tableName) {
      throw new BadRequestException(
        `la seccion ${section} no esta disponible para compartir`,
      );
    }

    const rows = await this.dataSource.query(
      `SELECT * FROM [${tableName}] WHERE pacienteid = @0`,
      [pacienteId],
    );
    return this.normalizeForJson(rows);
  }

  /**
   * Normaliza valores complejos para serializarlos a JSON.
   * @param value Valor a normalizar.
   * @returns Valor compatible con JSON.
   */
  private normalizeForJson(value: unknown): unknown {
    if (value === null || value === undefined) {
      return value;
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (Buffer.isBuffer(value)) {
      return value.toString("base64");
    }
    if (Array.isArray(value)) {
      return value.map((item) => this.normalizeForJson(item));
    }
    if (typeof value === "bigint") {
      return value.toString();
    }
    if (typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([key, item]) => [
          key,
          this.normalizeForJson(item),
        ]),
      );
    }
    return value;
  }
}
