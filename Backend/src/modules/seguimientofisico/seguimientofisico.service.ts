import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paciente } from '../paciente/paciente.entity';
import { CreateSeguimientofisicoDto } from './dto/create-seguimientofisico.dto';
import { UpdateSeguimientofisicoDto } from './dto/update-seguimientofisico.dto';
import { Seguimientofisico } from './seguimientofisico.entity';

type SeguimientoFisicoResponse = {
  seguimientoFisicoId: number;
  pacienteId: number;
  fecha: string;
  peso: number | null;
  minutosEjercicio: number | null;
  tipoEjercicio: string | null;
  intensidad: string | null;
  pasos: number | null;
  caloriasQuemadas: number | null;
  distanciaKm: number | null;
  notas: string | null;
  creadoPor: string | null;
  creadoEn: string;
  modificadoPor: string | null;
  modificadoEn: string | null;
  campoPrueba01: string | null;
  campoPrueba02: string | null;
  campoPrueba03: string | null;
  campoPrueba04: string | null;
  campoPrueba05: string | null;
};

@Injectable()
export class SeguimientofisicoService {
  constructor(
    @InjectRepository(Seguimientofisico)
    private readonly seguimientoRepository: Repository<Seguimientofisico>,
    @InjectRepository(Paciente)
    private readonly pacienteRepository: Repository<Paciente>,
  ) {}

  async create(
    payload: CreateSeguimientofisicoDto,
  ): Promise<SeguimientoFisicoResponse> {
    await this.assertPacienteExists(payload.pacienteId);
    await this.assertUniqueDate(payload.pacienteId, payload.fecha);
    const entity = this.seguimientoRepository.create(
      this.mapPayloadForSave(payload, true),
    );
    const saved = await this.seguimientoRepository.save(entity);
    return this.toResponse(saved);
  }

  async findAll(
    pacienteId?: number,
    desde?: string,
    hasta?: string,
  ): Promise<SeguimientoFisicoResponse[]> {
    const records = await this.findRecords(pacienteId, desde, hasta);
    return records.map((record) => this.toResponse(record));
  }

  async findOne(id: number): Promise<SeguimientoFisicoResponse> {
    const entity = await this.findEntity(id);
    return this.toResponse(entity);
  }

  async update(
    id: number,
    payload: UpdateSeguimientofisicoDto,
  ): Promise<SeguimientoFisicoResponse> {
    const entity = await this.findEntity(id);
    Object.assign(entity, this.mapPayloadForSave(payload, false));
    const saved = await this.seguimientoRepository.save(entity);
    return this.toResponse(saved);
  }

  async remove(id: number): Promise<void> {
    await this.findEntity(id);
    const result = await this.seguimientoRepository.delete({
      seguimientoFisicoId: id,
    });
    if (!result.affected) {
      throw new NotFoundException(`registro ${id} no encontrado en seguimientofisico`);
    }
  }

  async getHistorial(
    pacienteId: number,
    desde?: string,
    hasta?: string,
  ) {
    await this.assertPacienteExists(pacienteId);
    const records = await this.findRecords(pacienteId, desde, hasta);
    return {
      pacienteId,
      totalRegistros: records.length,
      registros: records.map((record) => this.toResponse(record)),
    };
  }

  async getResumen(
    pacienteId: number,
    desde?: string,
    hasta?: string,
  ) {
    await this.assertPacienteExists(pacienteId);
    const records = await this.findRecords(pacienteId, desde, hasta);
    const pesos = records
      .map((record) => record.peso)
      .filter((value): value is number => typeof value === 'number');
    const ejercicios = records
      .map((record) => record.minutosEjercicio)
      .filter((value): value is number => typeof value === 'number');
    const pasos = records
      .map((record) => record.pasos)
      .filter((value): value is number => typeof value === 'number');
    const calorias = records
      .map((record) => record.caloriasQuemadas)
      .filter((value): value is number => typeof value === 'number');

    return {
      pacienteId,
      totalRegistros: records.length,
      ultimoRegistro: records.length ? this.toResponse(records[records.length - 1]) : null,
      peso: {
        inicial: pesos.length ? pesos[0] : null,
        actual: pesos.length ? pesos[pesos.length - 1] : null,
        cambio:
          pesos.length > 1
            ? Math.round((pesos[pesos.length - 1] - pesos[0]) * 100) / 100
            : null,
      },
      ejercicio: {
        minutosTotales: this.sum(ejercicios),
        minutosPromedio: this.average(ejercicios),
        caloriasTotales: this.sum(calorias),
        pasosPromedio: this.average(pasos),
      },
    };
  }

  async getPesoProgress(
    pacienteId: number,
    desde?: string,
    hasta?: string,
  ) {
    await this.assertPacienteExists(pacienteId);
    const records = await this.findRecords(pacienteId, desde, hasta);
    return {
      pacienteId,
      puntos: records
        .filter((record) => typeof record.peso === 'number')
        .map((record) => ({
          fecha: this.toIsoDate(record.fecha),
          peso: record.peso as number,
        })),
    };
  }

  private async findEntity(id: number): Promise<Seguimientofisico> {
    const entity = await this.seguimientoRepository.findOne({
      where: { seguimientoFisicoId: id },
    });
    if (!entity) {
      throw new NotFoundException(`registro ${id} no encontrado en seguimientofisico`);
    }
    await this.assertPacienteExists(entity.pacienteId);
    return entity;
  }

  private async findRecords(
    pacienteId?: number,
    desde?: string,
    hasta?: string,
  ): Promise<Seguimientofisico[]> {
    if (pacienteId !== undefined) {
      await this.assertPacienteExists(pacienteId);
    }
    const fromDate = this.parseOptionalDate(desde);
    const toDate = this.parseOptionalDate(hasta);
    const records = await this.seguimientoRepository.find({
      where: pacienteId !== undefined ? { pacienteId } : {},
      order: { fecha: 'ASC', seguimientoFisicoId: 'ASC' },
    });
    return records.filter((record) => {
      const time = this.toDate(record.fecha).getTime();
      if (fromDate && time < fromDate.getTime()) {
        return false;
      }
      if (toDate && time > toDate.getTime()) {
        return false;
      }
      return true;
    });
  }

  private mapPayloadForSave(
    payload: CreateSeguimientofisicoDto | UpdateSeguimientofisicoDto,
    isCreate: boolean,
  ): Partial<Seguimientofisico> {
    const mapped: Partial<Seguimientofisico> = {};
    if ('pacienteId' in payload && payload.pacienteId !== undefined) {
      mapped.pacienteId = payload.pacienteId;
    }
    if (payload.fecha !== undefined) {
      mapped.fecha = new Date(payload.fecha);
    }
    if (payload.peso !== undefined) {
      mapped.peso = payload.peso;
    }
    if (payload.minutosEjercicio !== undefined) {
      mapped.minutosEjercicio = payload.minutosEjercicio;
    }
    if (payload.tipoEjercicio !== undefined) {
      mapped.tipoEjercicio = payload.tipoEjercicio;
    }
    if (payload.intensidad !== undefined) {
      mapped.intensidad = payload.intensidad;
    }
    if (payload.pasos !== undefined) {
      mapped.pasos = payload.pasos;
    }
    if (payload.caloriasQuemadas !== undefined) {
      mapped.caloriasQuemadas = payload.caloriasQuemadas;
    }
    if (payload.distanciaKm !== undefined) {
      mapped.distanciaKm = payload.distanciaKm;
    }
    if (payload.notas !== undefined) {
      mapped.notas = payload.notas;
    }
    if (payload.creadoPor !== undefined) {
      mapped.creadoPor = payload.creadoPor;
    }
    if (payload.modificadoPor !== undefined) {
      mapped.modificadoPor = payload.modificadoPor;
    }
    if (payload.campoPrueba01 !== undefined) {
      mapped.campoPrueba01 = payload.campoPrueba01;
    }
    if (payload.campoPrueba02 !== undefined) {
      mapped.campoPrueba02 = payload.campoPrueba02;
    }
    if (payload.campoPrueba03 !== undefined) {
      mapped.campoPrueba03 = payload.campoPrueba03;
    }
    if (payload.campoPrueba04 !== undefined) {
      mapped.campoPrueba04 = payload.campoPrueba04;
    }
    if (payload.campoPrueba05 !== undefined) {
      mapped.campoPrueba05 = payload.campoPrueba05;
    }

    if (isCreate) {
      mapped.creadoEn =
        'creadoEn' in payload && payload.creadoEn ? new Date(payload.creadoEn) : new Date();
      mapped.modificadoEn =
        'modificadoEn' in payload && payload.modificadoEn
          ? new Date(payload.modificadoEn)
          : undefined;
    } else {
      mapped.modificadoEn =
        'modificadoEn' in payload && payload.modificadoEn
          ? new Date(payload.modificadoEn)
          : new Date();
    }

    return mapped;
  }

  private async assertPacienteExists(pacienteId: number): Promise<void> {
    const paciente = await this.pacienteRepository.findOne({
      where: { pacienteId },
    });
    if (!paciente) {
      throw new NotFoundException(`paciente ${pacienteId} no encontrado`);
    }
  }

  private async assertUniqueDate(pacienteId: number, fecha: Date): Promise<void> {
    const existing = await this.seguimientoRepository.findOne({
      where: { pacienteId, fecha: new Date(fecha) },
    });
    if (existing) {
      throw new BadRequestException(
        'ya existe un registro de seguimiento fisico para ese paciente en esa fecha',
      );
    }
  }

  private parseOptionalDate(value?: string): Date | undefined {
    if (!value) {
      return undefined;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('la fecha enviada en filtros es invalida');
    }
    return parsed;
  }

  private sum(values: number[]): number | null {
    if (!values.length) {
      return null;
    }
    return Math.round(values.reduce((acc, value) => acc + value, 0) * 100) / 100;
  }

  private average(values: number[]): number | null {
    if (!values.length) {
      return null;
    }
    return Math.round((values.reduce((acc, value) => acc + value, 0) / values.length) * 100) / 100;
  }

  private toResponse(entity: Seguimientofisico): SeguimientoFisicoResponse {
    return {
      seguimientoFisicoId: entity.seguimientoFisicoId,
      pacienteId: entity.pacienteId,
      fecha: this.toIsoDate(entity.fecha),
      peso: entity.peso ?? null,
      minutosEjercicio: entity.minutosEjercicio ?? null,
      tipoEjercicio: entity.tipoEjercicio ?? null,
      intensidad: entity.intensidad ?? null,
      pasos: entity.pasos ?? null,
      caloriasQuemadas: entity.caloriasQuemadas ?? null,
      distanciaKm: entity.distanciaKm ?? null,
      notas: entity.notas ?? null,
      creadoPor: entity.creadoPor ?? null,
      creadoEn: entity.creadoEn.toISOString(),
      modificadoPor: entity.modificadoPor ?? null,
      modificadoEn: entity.modificadoEn?.toISOString() ?? null,
      campoPrueba01: entity.campoPrueba01 ?? null,
      campoPrueba02: entity.campoPrueba02 ?? null,
      campoPrueba03: entity.campoPrueba03 ?? null,
      campoPrueba04: entity.campoPrueba04 ?? null,
      campoPrueba05: entity.campoPrueba05 ?? null,
    };
  }

  private toDate(value: Date | string): Date {
    return value instanceof Date ? value : new Date(value);
  }

  private toIsoDate(value: Date | string): string {
    return this.toDate(value).toISOString().slice(0, 10);
  }
}
