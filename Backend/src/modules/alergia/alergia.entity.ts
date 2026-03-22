import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'alergia' })
export class Alergia {
  @PrimaryGeneratedColumn({ name: 'alergiaid', type: 'int' })
  alergiaId!: number;

  @Column({ name: 'pacienteid', type: 'int', precision: 10 })
  pacienteId!: number;

  @Column({ name: 'tipo', type: 'nvarchar', length: 120 })
  tipo!: string;

  @Column({ name: 'desencadenante', type: 'nvarchar', length: 200, nullable: true })
  desencadenante?: string;

  @Column({ name: 'severidad', type: 'nvarchar', length: 50, nullable: true })
  severidad?: string;

  @Column({ name: 'reaccion', type: 'nvarchar', nullable: true })
  reaccion?: string;

  @Column({ name: 'tratamiento', type: 'nvarchar', nullable: true })
  tratamiento?: string;

  @Column({ name: 'fechadiagnostico', type: 'date', nullable: true })
  fechadiagnostico?: Date;

  @Column({ name: 'estado', type: 'nvarchar', length: 40 })
  estado!: string;

  @Column({ name: 'observaciones', type: 'nvarchar', nullable: true })
  observaciones?: string;

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
