import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindOptionsWhere, Repository } from "typeorm";
import {
  decodeBase64Image,
  validateImageMimeType,
} from "../../common/utils/base64-image.util";
import { Institucionsalud } from "../institucionsalud/institucionsalud.entity";
import { CreateInstitucionimagenDto } from "./dto/create-institucionimagen.dto";
import { UpdateInstitucionimagenDto } from "./dto/update-institucionimagen.dto";
import { Institucionimagen } from "./institucionimagen.entity";

/**
 * Define el tipo institucion imagen filters utilizado por el backend.
 */
type InstitucionImagenFilters = {
  /**
   * Identificador persistido para `institucionSaludId`.
   */
  institucionSaludId?: number;
  /**
   * Campo de datos asociado a `activo`.
   */
  activo?: boolean;
  /**
   * Campo de datos asociado a `tipoImagen`.
   */
  tipoImagen?: string;
};

/**
 * Implementa la lógica de negocio y persistencia del dominio institucionimagen.
 */
@Injectable()
export class InstitucionimagenService {
  constructor(
    @InjectRepository(Institucionimagen)
    private readonly institucionImagenRepository: Repository<Institucionimagen>,
    @InjectRepository(Institucionsalud)
    private readonly institucionRepository: Repository<Institucionsalud>,
  ) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  async create(
    payload: CreateInstitucionimagenDto,
  ): Promise<Institucionimagen> {
    await this.assertInstitucionExists(payload.institucionSaludId);

    const entity = this.institucionImagenRepository.create({
      institucionSaludId: payload.institucionSaludId,
      tipoImagen: payload.tipoImagen ?? "otra",
      titulo: payload.titulo ?? null,
      descripcion: payload.descripcion ?? null,
      nombreArchivo: payload.nombreArchivo ?? null,
      mimeType: validateImageMimeType(payload.mimeType, "mimeType")!,
      imagen: decodeBase64Image(payload.imagenBase64, "imagenBase64")!,
      esPrincipal: payload.esPrincipal ?? false,
      ordenVisual: payload.ordenVisual ?? null,
      activo: payload.activo ?? true,
      creadoPor: payload.creadoPor ?? null,
      creadoEn: payload.creadoEn ?? new Date(),
      modificadoPor: payload.modificadoPor ?? null,
      modificadoEn: payload.modificadoEn ?? null,
    });

    if (entity.esPrincipal) {
      await this.clearPrincipalFlag(entity.institucionSaludId);
    }

    return this.institucionImagenRepository.save(entity);
  }

  /**
   * Find all.
   * @param filters Valor del parámetro `filters`.
   * @returns Colección de registros encontrados.
   */
  async findAll(
    filters: InstitucionImagenFilters = {},
  ): Promise<Institucionimagen[]> {
    const where: FindOptionsWhere<Institucionimagen> = {};
    if (filters.institucionSaludId !== undefined) {
      where.institucionSaludId = filters.institucionSaludId;
    }
    if (filters.activo !== undefined) {
      where.activo = filters.activo;
    }
    if (filters.tipoImagen) {
      where.tipoImagen = filters.tipoImagen;
    }
    return this.institucionImagenRepository.find({
      where,
      order: {
        esPrincipal: "DESC",
        ordenVisual: "ASC",
        institucionImagenId: "DESC",
      },
    });
  }

  /**
   * Find one.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  async findOne(id: number): Promise<Institucionimagen> {
    const entity = await this.institucionImagenRepository.findOne({
      where: { institucionImagenId: id },
    });
    if (!entity) {
      throw new NotFoundException(`imagen ${id} no encontrada`);
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
    payload: UpdateInstitucionimagenDto,
  ): Promise<Institucionimagen> {
    const entity = await this.findOne(id);
    const nextInstitucionId =
      payload.institucionSaludId ?? entity.institucionSaludId;
    await this.assertInstitucionExists(nextInstitucionId);

    if (payload.institucionSaludId !== undefined) {
      entity.institucionSaludId = payload.institucionSaludId;
    }
    if (payload.tipoImagen !== undefined) {
      entity.tipoImagen = payload.tipoImagen;
    }
    if (payload.titulo !== undefined) {
      entity.titulo = payload.titulo ?? null;
    }
    if (payload.descripcion !== undefined) {
      entity.descripcion = payload.descripcion ?? null;
    }
    if (payload.nombreArchivo !== undefined) {
      entity.nombreArchivo = payload.nombreArchivo ?? null;
    }
    if (payload.mimeType !== undefined) {
      entity.mimeType = validateImageMimeType(payload.mimeType, "mimeType")!;
    }
    if (payload.imagenBase64 !== undefined) {
      entity.imagen = decodeBase64Image(payload.imagenBase64, "imagenBase64")!;
    }
    if (payload.esPrincipal !== undefined) {
      entity.esPrincipal = payload.esPrincipal;
    }
    if (payload.ordenVisual !== undefined) {
      entity.ordenVisual = payload.ordenVisual ?? null;
    }
    if (payload.activo !== undefined) {
      entity.activo = payload.activo;
    }
    if (payload.creadoPor !== undefined) {
      entity.creadoPor = payload.creadoPor ?? null;
    }
    if (payload.creadoEn !== undefined) {
      entity.creadoEn = payload.creadoEn;
    }
    if (payload.modificadoPor !== undefined) {
      entity.modificadoPor = payload.modificadoPor ?? null;
    }
    entity.modificadoEn = payload.modificadoEn ?? new Date();

    if (entity.esPrincipal) {
      await this.clearPrincipalFlag(entity.institucionSaludId, id);
    }

    return this.institucionImagenRepository.save(entity);
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  async remove(id: number): Promise<void> {
    const result = await this.institucionImagenRepository.delete({
      institucionImagenId: id,
    });
    if (!result.affected) {
      throw new NotFoundException(`imagen ${id} no encontrada`);
    }
  }

  /**
   * Valida institucion exists.
   * @param institucionSaludId Identificador asociado a institucion salud.
   * @returns La promesa se resuelve cuando la validación se cumple.
   */
  private async assertInstitucionExists(
    institucionSaludId: number,
  ): Promise<void> {
    const institucion = await this.institucionRepository.findOne({
      where: { institucionSaludId },
    });
    if (!institucion) {
      throw new BadRequestException(
        `institucion ${institucionSaludId} no existe`,
      );
    }
  }

  /**
   * Clear principal flag.
   * @param institucionSaludId Identificador asociado a institucion salud.
   * @param keepId Identificador asociado a keep.
   * @returns La operación se completa sin devolver contenido.
   */
  private async clearPrincipalFlag(
    institucionSaludId: number,
    keepId?: number,
  ): Promise<void> {
    const images = await this.institucionImagenRepository.find({
      where: { institucionSaludId, esPrincipal: true },
    });

    const updates = images.filter(
      (image) => image.institucionImagenId !== keepId,
    );
    if (!updates.length) {
      return;
    }

    updates.forEach((image) => {
      image.esPrincipal = false;
      image.modificadoEn = new Date();
    });
    await this.institucionImagenRepository.save(updates);
  }
}
