import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'condicioncronica' })
export class Condicioncronica {
  @PrimaryGeneratedColumn({ name: 'condicioncronicaid', type: 'int' })
  condicioncronicaId!: number;

  @Column({ name: 'pacienteid', type: 'int', precision: 10 })
  pacienteId!: number;

  @Column({ name: 'tipocondicionid', type: 'int', precision: 10 })
  tipocondicionId!: number;

  @Column({ name: 'fechadiagnostico', type: 'date', nullable: true })
  fechadiagnostico?: Date;

  @Column({ name: 'estado', type: 'nvarchar', length: 40 })
  estado!: string;

  @Column({ name: 'severidad', type: 'nvarchar', length: 40, nullable: true })
  severidad?: string;

  @Column({ name: 'tratamientoprincipal', type: 'nvarchar', length: 200, nullable: true })
  tratamientoprincipal?: string;

  @Column({ name: 'proveedorlider', type: 'nvarchar', length: 120, nullable: true })
  proveedorlider?: string;

  @Column({ name: 'proximoseguimiento', type: 'date', nullable: true })
  proximoseguimiento?: Date;

  @Column({ name: 'notas', type: 'nvarchar', nullable: true })
  notas?: string;

  @Column({ name: 'creadopor', type: 'nvarchar', length: 60, nullable: true })
  creadopor?: string;

  @Column({ name: 'creadoen', type: 'datetime2', precision: 7 })
  creadoen!: Date;

  @Column({ name: 'modificadopor', type: 'nvarchar', length: 60, nullable: true })
  modificadopor?: string;

  @Column({ name: 'modificadoen', type: 'datetime2', precision: 7, nullable: true })
  modificadoen?: Date;

  @Column({ name: 'campoprueba01', type: 'nvarchar', length: 200, nullable: true })
  campoprueba01?: string;

  @Column({ name: 'campoprueba02', type: 'nvarchar', length: 200, nullable: true })
  campoprueba02?: string;

  @Column({ name: 'campoprueba03', type: 'nvarchar', length: 200, nullable: true })
  campoprueba03?: string;

  @Column({ name: 'campoprueba04', type: 'nvarchar', length: 200, nullable: true })
  campoprueba04?: string;

  @Column({ name: 'campoprueba05', type: 'nvarchar', length: 200, nullable: true })
  campoprueba05?: string;

}
