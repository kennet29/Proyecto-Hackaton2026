import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type PermisoTipo = 'temporal' | 'permanente';
export type PermisoEstado = 'activo' | 'revocado' | 'expirado';

@Entity({ name: 'permisoacceso' })
export class PermisoAcceso {
  @PrimaryGeneratedColumn({ name: 'permisoid' })
  id!: number;

  @Column({ name: 'pacienteid' })
  pacienteId!: number;

  @Column({ name: 'medicoid' })
  medicoId!: number;

  @Column({ name: 'tipo', type: 'nvarchar', length: 20 })
  tipo!: PermisoTipo;

  @Column({ name: 'duracion', type: 'nvarchar', length: 5, nullable: true })
  duracion?: string | null;

  @Column({ name: 'fechainicio', type: 'datetime2' })
  fechaInicio!: Date;

  @Column({ name: 'fechafin', type: 'datetime2', nullable: true })
  fechaFin?: Date | null;

  @Column({ name: 'estado', type: 'nvarchar', length: 20 })
  estado!: PermisoEstado;

  @Column({ name: 'notas', type: 'nvarchar', length: 200, nullable: true })
  notas?: string | null;

  @Column({ name: 'creadopor', type: 'nvarchar', length: 60, nullable: true })
  creadoPor?: string | null;

  @CreateDateColumn({ name: 'creadoen', type: 'datetime2', default: () => 'SYSDATETIME()' })
  creadoEn!: Date;

  @Column({ name: 'modificadopor', type: 'nvarchar', length: 60, nullable: true })
  modificadoPor?: string | null;

  @UpdateDateColumn({ name: 'modificadoen', type: 'datetime2', nullable: true })
  modificadoEn?: Date | null;
}
