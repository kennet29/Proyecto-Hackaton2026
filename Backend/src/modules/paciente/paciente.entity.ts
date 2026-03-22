import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'paciente' })
export class Paciente {
  @PrimaryGeneratedColumn({ name: 'pacienteid', type: 'int' })
  pacienteId!: number;

  @Column({ name: 'nombres', type: 'nvarchar', length: 100 })
  nombres!: string;

  @Column({ name: 'apellidos', type: 'nvarchar', length: 100 })
  apellidos!: string;

  @Column({ name: 'fechanacimiento', type: 'date', nullable: true })
  fechanacimiento?: Date;

  @Column({ name: 'sexo', type: 'char', length: 1, nullable: true })
  sexo?: string;

  @Column({ name: 'tipodocumento', type: 'nvarchar', length: 30, nullable: true })
  tipodocumento?: string;

  @Column({ name: 'numerodocumento', type: 'nvarchar', length: 50, nullable: true })
  numerodocumento?: string;

  @Column({ name: 'telefono', type: 'nvarchar', length: 30, nullable: true })
  telefono?: string;

  @Column({ name: 'email', type: 'nvarchar', length: 120, nullable: true })
  email?: string;

  @Column({ name: 'direccion', type: 'nvarchar', length: 200, nullable: true })
  direccion?: string;

  @Column({ name: 'fecharegistro', type: 'datetime2', precision: 7 })
  fecharegistro!: Date;

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
