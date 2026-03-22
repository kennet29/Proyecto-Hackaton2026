import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'evaluacionsaludhabito' })
export class Evaluacionsaludhabito {
  @PrimaryGeneratedColumn({ name: 'evaluacionid', type: 'int' })
  evaluacionId!: number;

  @Column({ name: 'pacienteid', type: 'int', precision: 10 })
  pacienteId!: number;

  @Column({ name: 'fecha', type: 'datetime2', precision: 7 })
  fecha!: Date;

  @Column({ name: 'puntaje', type: 'decimal', precision: 5, scale: 2 })
  puntaje!: number;

  @Column({ name: 'categoria', type: 'nvarchar', length: 80, nullable: true })
  categoria?: string;

  @Column({ name: 'resumen', type: 'nvarchar', length: 200, nullable: true })
  resumen?: string;

  @Column({ name: 'detalle', type: 'nvarchar', nullable: true })
  detalle?: string;

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
