import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';

@Injectable()
export class DatabaseService {
  private readonly allowedTables = new Set<string>([
    'paciente',
    'usuario',
    'rol',
    'permiso',
    'rolpermiso',
    'usuariorol',
    'especialidad',
    'tipovacuna',
    'tipolesion',
    'tipooperacion',
    'tipodocumentoclinico',
    'tipocondicioncronica',
    'consultamedica',
    'lesion',
    'estilovida',
    'vacuna',
    'citamedica',
    'registrodental',
    'operacion',
    'desparasitacion',
    'registromensual',
    'embarazo',
    'controlprenatal',
    'documentoclinico',
    'notificacion',
    'recordatoriocita',
    'medicacion',
    'horariomedicamento',
    'alergia',
    'antecedentefamiliar',
    'habitoespecifico',
    'puntajeriesgo',
    'condicioncronica',
    'objetivocronico',
    'controlcronico',
    'adherenciacronica'
  ]);

  private readonly storage = new Map<string, Map<string, any>>();

  constructor() {
    this.allowedTables.forEach((table) => {
      this.storage.set(table, new Map());
    });
  }

  listTables(): string[] {
    return Array.from(this.allowedTables.values());
  }

  create(table: string, data: Record<string, any>): Record<string, any> {
    const tableStore = this.ensureTable(table);
    const id = randomUUID();
    const timestamp = new Date().toISOString();
    const entity = {
      id,
      ...data,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    tableStore.set(id, entity);
    return entity;
  }

  findAll(table: string): Record<string, any>[] {
    const tableStore = this.ensureTable(table);
    return Array.from(tableStore.values());
  }

  findOne(table: string, id: string): Record<string, any> {
    const tableStore = this.ensureTable(table);
    const entity = tableStore.get(id);
    if (!entity) {
      throw new NotFoundException(`registro ${id} no encontrado en ${table}`);
    }
    return entity;
  }

  update(table: string, id: string, changes: Record<string, any>): Record<string, any> {
    const tableStore = this.ensureTable(table);
    const entity = tableStore.get(id);
    if (!entity) {
      throw new NotFoundException(`registro ${id} no encontrado en ${table}`);
    }
    const updated = {
      ...entity,
      ...changes,
      updatedAt: new Date().toISOString(),
    };
    tableStore.set(id, updated);
    return updated;
  }

  remove(table: string, id: string): void {
    const tableStore = this.ensureTable(table);
    if (!tableStore.delete(id)) {
      throw new NotFoundException(`registro ${id} no encontrado en ${table}`);
    }
  }

  private ensureTable(table: string): Map<string, any> {
    const normalized = table.toLowerCase();
    if (!this.allowedTables.has(normalized)) {
      throw new NotFoundException(`tabla ${table} no declarada en el catalogo`);
    }
    return this.storage.get(normalized)!;
  }
}
