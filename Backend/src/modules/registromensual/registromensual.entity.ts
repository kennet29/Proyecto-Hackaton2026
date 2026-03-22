import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'registromensual' })
export class Registromensual {
  @PrimaryGeneratedColumn({ name: 'registromensualid', type: 'int' })
  registromensualId!: number;

  @Column({ name: 'pacienteid', type: 'int', precision: 10 })
  pacienteId!: number;

  @Column({ name: 'mes', type: 'int', precision: 10, nullable: true })
  mes?: number;

  @Column({ name: 'anio', type: 'int', precision: 10 })
  anio!: number;

  @Column({ name: 'fechainicio', type: 'date' })
  fechainicio!: Date;

  @Column({ name: 'duraciondias', type: 'int', precision: 10, nullable: true })
  duraciondias?: number;

  @Column({ name: 'dolor', type: 'nvarchar', length: 100, nullable: true })
  dolor?: string;

  @Column({ name: 'sintomas', type: 'nvarchar', nullable: true })
  sintomas?: string;

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
