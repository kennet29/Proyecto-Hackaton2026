import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindOptionsWhere, Repository } from "typeorm";
import { Institucionsalud } from "../institucionsalud/institucionsalud.entity";
import { CreateInstitucionhorarioDto } from "./dto/create-institucionhorario.dto";
import { UpdateInstitucionhorarioDto } from "./dto/update-institucionhorario.dto";
import { Institucionhorario } from "./institucionhorario.entity";

/**
 * Define el tipo institucion horario filters utilizado por el backend.
 */
type InstitucionHorarioFilters = {
  /**
   * Identificador persistido para `institucionSaludId`.
   */
  institucionSaludId?: number;
  /**
   * Campo de datos asociado a `diaSemana`.
   */
  diaSemana?: number;
  /**
   * Campo de datos asociado a `activo`.
   */
  activo?: boolean;
};

/**
 * Implementa la lógica de negocio y persistencia del dominio institucionhorario.
 */
@Injectable()
export class InstitucionhorarioService {
  constructor(
    @InjectRepository(Institucionhorario)
    private readonly horarioRepository: Repository<Institucionhorario>,
    @InjectRepository(Institucionsalud)
    private readonly institucionRepository: Repository<Institucionsalud>,
  ) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  async create(
    payload: CreateInstitucionhorarioDto,
  ): Promise<Institucionhorario> {
    await this.assertInstitucionExists(payload.institucionSaludId);
    await this.assertUniqueDay(payload.institucionSaludId, payload.diaSemana);

    const entity = this.horarioRepository.create({
      ...payload,
      horaInicio:
        payload.veinticuatroHoras || payload.cerrado
          ? null
          : (payload.horaInicio ?? null),
      horaFin:
        payload.veinticuatroHoras || payload.cerrado
          ? null
          : (payload.horaFin ?? null),
      cerrado: payload.cerrado ?? false,
      veinticuatroHoras: payload.veinticuatroHoras ?? false,
      activo: payload.activo ?? true,
      creadoEn: payload.creadoEn ?? new Date(),
      modificadoEn: payload.modificadoEn ?? null,
    });
    return this.horarioRepository.save(entity);
  }

  /**
   * Find all.
   * @param filters Valor del parámetro `filters`.
   * @returns Colección de registros encontrados.
   */
  async findAll(
    filters: InstitucionHorarioFilters = {},
  ): Promise<Institucionhorario[]> {
    const where: FindOptionsWhere<Institucionhorario> = {};
    if (filters.institucionSaludId !== undefined) {
      where.institucionSaludId = filters.institucionSaludId;
    }
    if (filters.diaSemana !== undefined) {
      where.diaSemana = filters.diaSemana;
    }
    if (filters.activo !== undefined) {
      where.activo = filters.activo;
    }
    return this.horarioRepository.find({
      where,
      order: { institucionSaludId: "ASC", diaSemana: "ASC" },
    });
  }

  /**
   * Find one.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  async findOne(id: number): Promise<Institucionhorario> {
    const entity = await this.horarioRepository.findOne({
      where: { institucionHorarioId: id },
    });
    if (!entity) {
      throw new NotFoundException(`horario ${id} no encontrado`);
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
    payload: UpdateInstitucionhorarioDto,
  ): Promise<Institucionhorario> {
    const entity = await this.findOne(id);
    const nextInstitucionId =
      payload.institucionSaludId ?? entity.institucionSaludId;
    const nextDiaSemana = payload.diaSemana ?? entity.diaSemana;

    await this.assertInstitucionExists(nextInstitucionId);
    if (
      nextInstitucionId !== entity.institucionSaludId ||
      nextDiaSemana !== entity.diaSemana
    ) {
      await this.assertUniqueDay(nextInstitucionId, nextDiaSemana, id);
    }

    Object.assign(entity, payload);
    if (payload.cerrado === true || payload.veinticuatroHoras === true) {
      entity.horaInicio = null;
      entity.horaFin = null;
    }
    entity.modificadoEn = payload.modificadoEn ?? new Date();
    return this.horarioRepository.save(entity);
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  async remove(id: number): Promise<void> {
    const result = await this.horarioRepository.delete({
      institucionHorarioId: id,
    });
    if (!result.affected) {
      throw new NotFoundException(`horario ${id} no encontrado`);
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
   * Valida unique day.
   * @param institucionSaludId Identificador asociado a institucion salud.
   * @param diaSemana Valor del parámetro `diaSemana`.
   * @param currentId Identificador asociado a current.
   * @returns La promesa se resuelve cuando la validación se cumple.
   */
  private async assertUniqueDay(
    institucionSaludId: number,
    diaSemana: number,
    currentId?: number,
  ): Promise<void> {
    const existing = await this.horarioRepository.findOne({
      where: { institucionSaludId, diaSemana },
    });
    if (existing && existing.institucionHorarioId !== currentId) {
      throw new BadRequestException(
        "ya existe un horario para ese dia en la institucion",
      );
    }
  }
}
