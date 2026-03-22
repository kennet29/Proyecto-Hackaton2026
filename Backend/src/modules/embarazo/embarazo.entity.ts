import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'embarazo' })
export class Embarazo {
  @PrimaryGeneratedColumn({ name: 'embarazoid', type: 'int' })
  embarazoId!: number;

  @Column({ name: 'pacienteid', type: 'int', precision: 10 })
  pacienteId!: number;

  @Column({ name: 'fechainicio', type: 'date' })
  fechainicio!: Date;

  @Column({ name: 'fechaprobableparto', type: 'date', nullable: true })
  fechaprobableparto?: Date;

  @Column({ name: 'numerocontrol', type: 'int', precision: 10, nullable: true })
  numerocontrol?: number;

  @Column({ name: 'riesgo', type: 'nvarchar', length: 100, nullable: true })
  riesgo?: string;

  @Column({ name: 'estado', type: 'nvarchar', length: 40 })
  estado!: string;

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
