import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'periodo' })
export class Periodo {
  @PrimaryGeneratedColumn({ name: 'periodoid', type: 'int' })
  periodoId!: number;

  @Column({ name: 'pacienteid', type: 'int', precision: 10 })
  pacienteId!: number;

  @Column({ name: 'fechainicio', type: 'date' })
  fechaInicio!: Date;

  @Column({ name: 'fechafin', type: 'date', nullable: true })
  fechaFin?: Date;

  @Column({ name: 'duraciondias', type: 'int', precision: 10, nullable: true })
  duracionDias?: number;

  @Column({ name: 'ciclodias', type: 'int', precision: 10, nullable: true })
  cicloDias?: number;

  @Column({ name: 'flujo', type: 'nvarchar', length: 30, nullable: true })
  flujo?: string;

  @Column({ name: 'dolor', type: 'nvarchar', length: 100, nullable: true })
  dolor?: string;

  @Column({ name: 'sintomas', type: 'nvarchar', length: 'max', nullable: true })
  sintomas?: string;

  @Column({ name: 'observaciones', type: 'nvarchar', length: 'max', nullable: true })
  observaciones?: string;

  @Column({ name: 'creadopor', type: 'nvarchar', length: 60, nullable: true })
  creadoPor?: string;

  @Column({ name: 'creadoen', type: 'datetime2', precision: 7 })
  creadoEn!: Date;

  @Column({ name: 'modificadopor', type: 'nvarchar', length: 60, nullable: true })
  modificadoPor?: string;

  @Column({ name: 'modificadoen', type: 'datetime2', precision: 7, nullable: true })
  modificadoEn?: Date;

  @Column({ name: 'campoprueba01', type: 'nvarchar', length: 200, nullable: true })
  campoPrueba01?: string;

  @Column({ name: 'campoprueba02', type: 'nvarchar', length: 200, nullable: true })
  campoPrueba02?: string;

  @Column({ name: 'campoprueba03', type: 'nvarchar', length: 200, nullable: true })
  campoPrueba03?: string;

  @Column({ name: 'campoprueba04', type: 'nvarchar', length: 200, nullable: true })
  campoPrueba04?: string;

  @Column({ name: 'campoprueba05', type: 'nvarchar', length: 200, nullable: true })
  campoPrueba05?: string;
}
