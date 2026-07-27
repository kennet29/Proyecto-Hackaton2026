import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { Usuario } from "../../users/entities/user.entity";
import { CreateMedicoregistroDto } from "./dto/create-medicoregistro.dto";
import { UpdateMedicoregistroDto } from "./dto/update-medicoregistro.dto";
import { Medicoregistro } from "./medicoregistro.entity";

/**
 * Implementa la lógica de negocio y persistencia del dominio medicoregistro.
 */
@Injectable()
export class MedicoregistroService {
  constructor(
    @InjectRepository(Medicoregistro)
    private readonly medicoregistroRepository: Repository<Medicoregistro>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  async create(payload: CreateMedicoregistroDto): Promise<Medicoregistro> {
    await this.ensureUsuarioExists(payload.usuarioId);

    const existing = await this.medicoregistroRepository.findOne({
      where: { usuarioId: payload.usuarioId },
    });
    if (existing) {
      throw new BadRequestException(
        "ya existe una solicitud de medico para este usuario",
      );
    }

    const entity = this.medicoregistroRepository.create();
    entity.usuarioId = payload.usuarioId;
    entity.hospitaltrabajo = payload.hospitaltrabajo;
    entity.titulo = payload.titulo;
    entity.codigominsa = payload.codigominsa ?? null;
    entity.numerolicencia = payload.numerolicencia;
    entity.entidadcertificadora = payload.entidadcertificadora ?? null;
    entity.especialidadprincipal = payload.especialidadprincipal ?? null;
    entity.documentorespaldo = payload.documentorespaldo ?? null;
    entity.fotocodigominsa =
      this.decodeBase64(payload.fotocodigominsaBase64, "fotocodigominsa") ??
      null;
    entity.fototitulo =
      this.decodeBase64(payload.fototituloBase64, "fototitulo") ?? null;
    entity.estado = "pendiente";
    entity.fechasolicitud = payload.creadoen ?? new Date();
    entity.observaciones = payload.observaciones ?? null;
    entity.creadopor = payload.creadopor ?? null;
    entity.creadoen = payload.creadoen ?? new Date();
    entity.modificadopor = payload.modificadopor ?? null;
    entity.modificadoen = payload.modificadoen ?? null;
    return this.medicoregistroRepository.save(entity);
  }

  /**
   * Find all.
   * @returns Colección de registros encontrados.
   */
  async findAll() {
    const registros = await this.medicoregistroRepository.find({
      order: { fechasolicitud: "DESC", medicoregistroId: "DESC" },
    });
    const usuarioIds = [...new Set(registros.map((item) => item.usuarioId))];
    const usuarios = usuarioIds.length
      ? await this.usuarioRepository.find({
          where: { id: In(usuarioIds) },
          select: {
            id: true,
            username: true,
            city: true,
            country: true,
            role: true,
            creadoPor: true,
          },
        })
      : [];
    const usuarioPorId = new Map(usuarios.map((usuario) => [usuario.id, usuario]));

    return registros.map((registro) => {
      const { fotocodigominsa, fototitulo, ...solicitud } = registro;
      const usuario = usuarioPorId.get(registro.usuarioId);
      return {
        ...solicitud,
        tieneFotoCodigoMinsa: Boolean(fotocodigominsa?.length),
        tieneFotoTitulo: Boolean(fototitulo?.length),
        usuario: usuario
          ? {
              id: usuario.id,
              username: usuario.username,
              email: usuario.creadoPor ?? null,
              city: usuario.city ?? null,
              country: usuario.country ?? null,
              role: usuario.role,
            }
          : null,
      };
    });
  }

  /**
   * Find one.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  async findOne(id: number): Promise<Medicoregistro> {
    const entity = await this.medicoregistroRepository.findOne({
      where: { medicoregistroId: id },
    });
    if (!entity) {
      throw new NotFoundException(
        `registro ${id} no encontrado en medicoregistro`,
      );
    }
    return entity;
  }

  /**
   * Find by usuario.
   * @param usuarioId Identificador asociado a usuario.
   * @returns Resultado de la operación.
   */
  async findByUsuario(usuarioId: number): Promise<Medicoregistro> {
    const entity = await this.medicoregistroRepository.findOne({
      where: { usuarioId },
    });
    if (!entity) {
      throw new NotFoundException(
        `no existe solicitud medica para el usuario ${usuarioId}`,
      );
    }
    return entity;
  }

  /**
   * Update.
   * @param id Identificador del registro objetivo.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro actualizado.
   */
  async update(
    id: number,
    payload: UpdateMedicoregistroDto,
  ): Promise<Medicoregistro> {
    const entity = await this.findOne(id);

    if (
      payload.usuarioId !== undefined &&
      payload.usuarioId !== entity.usuarioId
    ) {
      await this.ensureUsuarioExists(payload.usuarioId);
      const existing = await this.medicoregistroRepository.findOne({
        where: { usuarioId: payload.usuarioId },
      });
      if (existing && existing.medicoregistroId !== entity.medicoregistroId) {
        throw new BadRequestException(
          "ya existe una solicitud de medico para este usuario",
        );
      }
      entity.usuarioId = payload.usuarioId;
    }

    if (payload.hospitaltrabajo !== undefined) {
      entity.hospitaltrabajo = payload.hospitaltrabajo;
    }
    if (payload.titulo !== undefined) {
      entity.titulo = payload.titulo;
    }
    if (payload.codigominsa !== undefined) {
      entity.codigominsa = payload.codigominsa ?? null;
    }
    if (payload.numerolicencia !== undefined) {
      entity.numerolicencia = payload.numerolicencia;
    }
    if (payload.entidadcertificadora !== undefined) {
      entity.entidadcertificadora = payload.entidadcertificadora ?? null;
    }
    if (payload.especialidadprincipal !== undefined) {
      entity.especialidadprincipal = payload.especialidadprincipal ?? null;
    }
    if (payload.documentorespaldo !== undefined) {
      entity.documentorespaldo = payload.documentorespaldo ?? null;
    }
    if (payload.fotocodigominsaBase64 !== undefined) {
      entity.fotocodigominsa =
        this.decodeBase64(payload.fotocodigominsaBase64, "fotocodigominsa") ??
        null;
    }
    if (payload.fototituloBase64 !== undefined) {
      entity.fototitulo =
        this.decodeBase64(payload.fototituloBase64, "fototitulo") ?? null;
    }
    if (payload.estado !== undefined) {
      entity.estado = payload.estado;
      if (payload.estado === "pendiente") {
        entity.fecharevision = null;
      } else if (payload.fecharevision === undefined) {
        entity.fecharevision = new Date();
      }
    }
    if (payload.fechasolicitud !== undefined) {
      entity.fechasolicitud = payload.fechasolicitud;
    }
    if (payload.fecharevision !== undefined) {
      entity.fecharevision = payload.fecharevision ?? null;
    }
    if (payload.observaciones !== undefined) {
      entity.observaciones = payload.observaciones ?? null;
    }
    if (payload.creadopor !== undefined) {
      entity.creadopor = payload.creadopor ?? null;
    }
    if (payload.creadoen !== undefined) {
      entity.creadoen = payload.creadoen;
    }
    if (payload.modificadopor !== undefined) {
      entity.modificadopor = payload.modificadopor ?? null;
    }
    entity.modificadoen = payload.modificadoen ?? new Date();

    return this.medicoregistroRepository.save(entity);
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  async remove(id: number): Promise<void> {
    const result = await this.medicoregistroRepository.delete({
      medicoregistroId: id,
    });
    if (!result.affected) {
      throw new NotFoundException(
        `registro ${id} no encontrado en medicoregistro`,
      );
    }
  }

  /**
   * Ensure usuario exists.
   * @param usuarioId Identificador asociado a usuario.
   * @returns La operación se completa sin devolver contenido.
   */
  private async ensureUsuarioExists(usuarioId: number): Promise<void> {
    const usuario = await this.usuarioRepository.findOne({
      where: { id: usuarioId },
    });
    if (!usuario) {
      throw new BadRequestException(`el usuario ${usuarioId} no existe`);
    }
  }

  /**
   * Decode base64.
   * @param value Valor de entrada que se debe transformar o validar.
   * @param field Valor del parámetro `field`.
   * @returns Resultado de la operación.
   */
  private decodeBase64(
    value: string | null | undefined,
    field: string,
  ): Buffer | null | undefined {
    if (value === undefined) {
      return undefined;
    }
    if (value === null) {
      return null;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const payload = trimmed.startsWith("data:")
      ? (trimmed.split(",", 2)[1] ?? "").trim()
      : trimmed.replace(/\s+/g, "");

    if (
      !payload ||
      payload.length % 4 !== 0 ||
      !/^[A-Za-z0-9+/]+={0,2}$/.test(payload)
    ) {
      throw new BadRequestException(
        `${field} debe ser una cadena base64 valida`,
      );
    }

    const buffer = Buffer.from(payload, "base64");
    if (!buffer.length) {
      throw new BadRequestException(`${field} no contiene datos validos`);
    }
    return buffer;
  }
}
