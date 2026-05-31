import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Brackets, Repository } from "typeorm";
import {
  decodeBase64Image,
  validateImageMimeType,
} from "../../common/utils/base64-image.util";
import { CreateInstitucionsaludDto } from "./dto/create-institucionsalud.dto";
import { UpdateInstitucionsaludDto } from "./dto/update-institucionsalud.dto";
import { Institucionsalud } from "./institucionsalud.entity";

/**
 * Define el tipo institucion filters utilizado por el backend.
 */
type InstitucionFilters = {
  /**
   * Campo de datos asociado a `q`.
   */
  q?: string;
  /**
   * Campo de datos asociado a `tipo`.
   */
  tipo?: string;
  /**
   * Campo de datos asociado a `ciudad`.
   */
  ciudad?: string;
  /**
   * Campo de datos asociado a `departamento`.
   */
  departamento?: string;
  /**
   * Campo de datos asociado a `activo`.
   */
  activo?: boolean;
  /**
   * Campo de datos asociado a `conUbicacion`.
   */
  conUbicacion?: boolean;
  /**
   * Identificador persistido para `especialidadId`.
   */
  especialidadId?: number;
  /**
   * Campo de datos asociado a `latMin`.
   */
  latMin?: number;
  /**
   * Campo de datos asociado a `latMax`.
   */
  latMax?: number;
  /**
   * Campo de datos asociado a `lngMin`.
   */
  lngMin?: number;
  /**
   * Campo de datos asociado a `lngMax`.
   */
  lngMax?: number;
};

/**
 * Define el tipo nearby filters utilizado por el backend.
 */
type NearbyFilters = {
  /**
   * Campo de datos asociado a `latitud`.
   */
  latitud: number;
  /**
   * Campo de datos asociado a `longitud`.
   */
  longitud: number;
  /**
   * Campo de datos asociado a `radioKm`.
   */
  radioKm?: number;
  /**
   * Campo de datos asociado a `limit`.
   */
  limit?: number;
  /**
   * Campo de datos asociado a `tipo`.
   */
  tipo?: string;
  /**
   * Campo de datos asociado a `ciudad`.
   */
  ciudad?: string;
  /**
   * Campo de datos asociado a `departamento`.
   */
  departamento?: string;
  /**
   * Campo de datos asociado a `activo`.
   */
  activo?: boolean;
  /**
   * Identificador persistido para `especialidadId`.
   */
  especialidadId?: number;
};

/**
 * Implementa la lógica de negocio y persistencia del dominio institucionsalud.
 */
@Injectable()
export class InstitucionsaludService {
  constructor(
    @InjectRepository(Institucionsalud)
    private readonly institucionRepository: Repository<Institucionsalud>,
  ) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  create(payload: CreateInstitucionsaludDto): Promise<Institucionsalud> {
    const entity = this.institucionRepository.create({
      activo: payload.activo ?? true,
      nombre: payload.nombre,
      tipo: payload.tipo,
      descripcion: payload.descripcion ?? null,
      telefono: payload.telefono ?? null,
      correo: payload.correo ?? null,
      sitioWeb: payload.sitioWeb ?? null,
      direccion: payload.direccion ?? null,
      ciudad: payload.ciudad ?? null,
      departamento: payload.departamento ?? null,
      horarioAtencion: payload.horarioAtencion ?? null,
      latitud: payload.latitud ?? null,
      longitud: payload.longitud ?? null,
      logoImagen: decodeBase64Image(payload.logoBase64, "logoBase64") ?? null,
      logoMimeType:
        validateImageMimeType(payload.logoMimeType, "logoMimeType") ?? null,
      logoNombreArchivo: payload.logoNombreArchivo ?? null,
      creadoEn: payload.creadoEn ?? new Date(),
      creadoPor: payload.creadoPor ?? null,
      modificadoPor: payload.modificadoPor ?? null,
      modificadoEn: payload.modificadoEn ?? null,
    });
    return this.institucionRepository.save(entity);
  }

  /**
   * Find all.
   * @param filters Valor del parámetro `filters`.
   * @returns Colección de registros encontrados.
   */
  async findAll(filters: InstitucionFilters = {}): Promise<Institucionsalud[]> {
    const qb = this.institucionRepository.createQueryBuilder("institucion");

    if (filters.q) {
      const q = `%${filters.q.trim()}%`;
      qb.andWhere(
        new Brackets((subQb) => {
          subQb
            .where("institucion.nombre LIKE :q", { q })
            .orWhere("institucion.descripcion LIKE :q", { q })
            .orWhere("institucion.direccion LIKE :q", { q })
            .orWhere("institucion.ciudad LIKE :q", { q })
            .orWhere("institucion.departamento LIKE :q", { q });
        }),
      );
    }

    if (filters.tipo) {
      qb.andWhere("LOWER(institucion.tipo) = LOWER(:tipo)", {
        tipo: filters.tipo.trim(),
      });
    }

    if (filters.ciudad) {
      qb.andWhere("LOWER(institucion.ciudad) = LOWER(:ciudad)", {
        ciudad: filters.ciudad.trim(),
      });
    }

    if (filters.departamento) {
      qb.andWhere("LOWER(institucion.departamento) = LOWER(:departamento)", {
        departamento: filters.departamento.trim(),
      });
    }

    if (filters.activo !== undefined) {
      qb.andWhere("institucion.activo = :activo", { activo: filters.activo });
    }

    if (filters.especialidadId !== undefined) {
      qb.innerJoin(
        "institucionespecialidad",
        "institucionEspecialidad",
        "institucionEspecialidad.institucionsaludid = institucion.institucionsaludid AND institucionEspecialidad.activo = 1 AND institucionEspecialidad.especialidadid = :especialidadId",
        { especialidadId: filters.especialidadId },
      );
    }

    if (filters.conUbicacion === true) {
      qb.andWhere("institucion.latitud IS NOT NULL").andWhere(
        "institucion.longitud IS NOT NULL",
      );
    } else if (filters.conUbicacion === false) {
      qb.andWhere(
        new Brackets((subQb) => {
          subQb
            .where("institucion.latitud IS NULL")
            .orWhere("institucion.longitud IS NULL");
        }),
      );
    }

    if (filters.latMin !== undefined) {
      qb.andWhere("institucion.latitud >= :latMin", { latMin: filters.latMin });
    }
    if (filters.latMax !== undefined) {
      qb.andWhere("institucion.latitud <= :latMax", { latMax: filters.latMax });
    }
    if (filters.lngMin !== undefined) {
      qb.andWhere("institucion.longitud >= :lngMin", {
        lngMin: filters.lngMin,
      });
    }
    if (filters.lngMax !== undefined) {
      qb.andWhere("institucion.longitud <= :lngMax", {
        lngMax: filters.lngMax,
      });
    }

    qb.orderBy("institucion.nombre", "ASC");

    return qb.getMany();
  }

  /**
   * Find nearby.
   * @param filters Valor del parámetro `filters`.
   * @returns Resultado de la operación.
   */
  async findNearby(filters: NearbyFilters) {
    const radioKm = filters.radioKm ?? 10;
    const limit = filters.limit ?? 50;
    const instituciones = await this.findAll({
      tipo: filters.tipo,
      ciudad: filters.ciudad,
      departamento: filters.departamento,
      activo: filters.activo ?? true,
      conUbicacion: true,
      especialidadId: filters.especialidadId,
    });

    return instituciones
      .map((institucion) => ({
        ...institucion,
        distanciaKm: this.calculateDistanceKm(
          filters.latitud,
          filters.longitud,
          Number(institucion.latitud),
          Number(institucion.longitud),
        ),
      }))
      .filter((institucion) => institucion.distanciaKm <= radioKm)
      .sort((a, b) => a.distanciaKm - b.distanciaKm)
      .slice(0, limit);
  }

  /**
   * Find one.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  async findOne(id: number): Promise<Institucionsalud> {
    const entity = await this.institucionRepository.findOne({
      where: { institucionSaludId: id },
    });
    if (!entity) {
      throw new NotFoundException(`institucion ${id} no encontrada`);
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
    payload: UpdateInstitucionsaludDto,
  ): Promise<Institucionsalud> {
    const entity = await this.findOne(id);
    if (payload.nombre !== undefined) {
      entity.nombre = payload.nombre;
    }
    if (payload.tipo !== undefined) {
      entity.tipo = payload.tipo;
    }
    if (payload.descripcion !== undefined) {
      entity.descripcion = payload.descripcion ?? null;
    }
    if (payload.telefono !== undefined) {
      entity.telefono = payload.telefono ?? null;
    }
    if (payload.correo !== undefined) {
      entity.correo = payload.correo ?? null;
    }
    if (payload.sitioWeb !== undefined) {
      entity.sitioWeb = payload.sitioWeb ?? null;
    }
    if (payload.direccion !== undefined) {
      entity.direccion = payload.direccion ?? null;
    }
    if (payload.ciudad !== undefined) {
      entity.ciudad = payload.ciudad ?? null;
    }
    if (payload.departamento !== undefined) {
      entity.departamento = payload.departamento ?? null;
    }
    if (payload.horarioAtencion !== undefined) {
      entity.horarioAtencion = payload.horarioAtencion ?? null;
    }
    if (payload.latitud !== undefined) {
      entity.latitud = payload.latitud ?? null;
    }
    if (payload.longitud !== undefined) {
      entity.longitud = payload.longitud ?? null;
    }
    if (payload.logoBase64 !== undefined) {
      entity.logoImagen =
        decodeBase64Image(payload.logoBase64, "logoBase64") ?? null;
    }
    if (payload.logoMimeType !== undefined) {
      entity.logoMimeType =
        validateImageMimeType(payload.logoMimeType, "logoMimeType") ?? null;
    }
    if (payload.logoNombreArchivo !== undefined) {
      entity.logoNombreArchivo = payload.logoNombreArchivo ?? null;
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
    return this.institucionRepository.save(entity);
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  async remove(id: number): Promise<void> {
    const result = await this.institucionRepository.delete({
      institucionSaludId: id,
    });
    if (!result.affected) {
      throw new NotFoundException(`institucion ${id} no encontrada`);
    }
  }

  /**
   * Calculate distance km.
   * @param originLat Valor del parámetro `originLat`.
   * @param originLng Valor del parámetro `originLng`.
   * @param destinationLat Valor del parámetro `destinationLat`.
   * @param destinationLng Valor del parámetro `destinationLng`.
   * @returns Resultado de la operación.
   */
  private calculateDistanceKm(
    originLat: number,
    originLng: number,
    destinationLat: number,
    destinationLng: number,
  ): number {
    const earthRadiusKm = 6371;
    const latDelta = this.toRadians(destinationLat - originLat);
    const lngDelta = this.toRadians(destinationLng - originLng);
    const a =
      Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
      Math.cos(this.toRadians(originLat)) *
        Math.cos(this.toRadians(destinationLat)) *
        Math.sin(lngDelta / 2) *
        Math.sin(lngDelta / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(earthRadiusKm * c * 100) / 100;
  }

  /**
   * Convierte el valor a radians.
   * @param value Valor de entrada que se debe transformar o validar.
   * @returns Valor convertido al formato de salida esperado.
   */
  private toRadians(value: number): number {
    return (value * Math.PI) / 180;
  }
}
