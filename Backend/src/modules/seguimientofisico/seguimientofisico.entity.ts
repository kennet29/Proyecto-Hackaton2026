import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'seguimientofisico' })
export class Seguimientofisico {
  @PrimaryGeneratedColumn({ name: 'seguimientofisicoid', type: 'int' })
  seguimientoFisicoId!: number;

  @Column({ name: 'pacienteid', type: 'int', precision: 10 })
  pacienteId!: number;

  @Column({ name: 'fecha', type: 'date' })
  fecha!: Date;

  @Column({ name: 'peso', type: 'decimal', precision: 6, scale: 2, nullable: true })
  peso?: number | null;

  @Column({ name: 'minutosejercicio', type: 'int', precision: 10, nullable: true })
  minutosEjercicio?: number | null;

  @Column({ name: 'tipoejercicio', type: 'nvarchar', length: 120, nullable: true })
  tipoEjercicio?: string | null;

  @Column({ name: 'intensidad', type: 'nvarchar', length: 30, nullable: true })
  intensidad?: string | null;

  @Column({ name: 'pasos', type: 'int', precision: 10, nullable: true })
  pasos?: number | null;

  @Column({ name: 'caloriasquemadas', type: 'int', precision: 10, nullable: true })
  caloriasQuemadas?: number | null;

  @Column({ name: 'distanciakm', type: 'decimal', precision: 6, scale: 2, nullable: true })
  distanciaKm?: number | null;

  @Column({ name: 'notas', type: 'nvarchar', length: 'max', nullable: true })
  notas?: string | null;

  @Column({ name: 'creadopor', type: 'nvarchar', length: 60, nullable: true })
  creadoPor?: string | null;

  @Column({ name: 'creadoen', type: 'datetime2', precision: 7 })
  creadoEn!: Date;

  @Column({ name: 'modificadopor', type: 'nvarchar', length: 60, nullable: true })
  modificadoPor?: string | null;

  @Column({ name: 'modificadoen', type: 'datetime2', precision: 7, nullable: true })
  modificadoEn?: Date | null;

  @Column({ name: 'campoprueba01', type: 'nvarchar', length: 200, nullable: true })
  campoPrueba01?: string | null;

  @Column({ name: 'campoprueba02', type: 'nvarchar', length: 200, nullable: true })
  campoPrueba02?: string | null;

  @Column({ name: 'campoprueba03', type: 'nvarchar', length: 200, nullable: true })
  campoPrueba03?: string | null;

  @Column({ name: 'campoprueba04', type: 'nvarchar', length: 200, nullable: true })
  campoPrueba04?: string | null;

  @Column({ name: 'campoprueba05', type: 'nvarchar', length: 200, nullable: true })
  campoPrueba05?: string | null;
}
