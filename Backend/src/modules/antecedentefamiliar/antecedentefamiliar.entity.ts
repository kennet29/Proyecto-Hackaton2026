import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'antecedentefamiliar' })
export class Antecedentefamiliar {
  @PrimaryGeneratedColumn({ name: 'antecedenteid', type: 'int' })
  antecedenteId!: number;

  @Column({ name: 'pacienteid', type: 'int', precision: 10 })
  pacienteId!: number;

  @Column({ name: 'parentesco', type: 'nvarchar', length: 80 })
  parentesco!: string;

  @Column({ name: 'condicion', type: 'nvarchar', length: 150 })
  condicion!: string;

  @Column({ name: 'estado', type: 'nvarchar', length: 50, nullable: true })
  estado?: string;

  @Column({ name: 'edaddiagnostico', type: 'int', precision: 10, nullable: true })
  edaddiagnostico?: number;

  @Column({ name: 'observaciones', type: 'nvarchar', nullable: true })
  observaciones?: string;

  @Column({ name: 'fecharegistro', type: 'datetime2', precision: 7 })
  fecharegistro!: Date;

  @Column({ name: 'confirmado', type: 'bit' })
  confirmado!: boolean;

  @Column({ name: 'fuente', type: 'nvarchar', length: 100, nullable: true })
  fuente?: string;

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
