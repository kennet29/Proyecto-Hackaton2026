import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'recordatoriocita' })
export class Recordatoriocita {
  @PrimaryGeneratedColumn({ name: 'recordatoriocitaid', type: 'int' })
  recordatoriocitaId!: number;

  @Column({ name: 'citaid', type: 'int', precision: 10 })
  citaId!: number;

  @Column({ name: 'pacienteid', type: 'int', precision: 10 })
  pacienteId!: number;

  @Column({ name: 'fecharecordatorio', type: 'datetime2', precision: 7 })
  fecharecordatorio!: Date;

  @Column({ name: 'mensaje', type: 'nvarchar', length: 300 })
  mensaje!: string;

  @Column({ name: 'canal', type: 'nvarchar', length: 50, nullable: true })
  canal?: string;

  @Column({ name: 'estado', type: 'nvarchar', length: 30 })
  estado!: string;

  @Column({ name: 'intentos', type: 'int', precision: 10 })
  intentos!: number;

  @Column({ name: 'ultimointento', type: 'datetime2', precision: 7, nullable: true })
  ultimointento?: Date;

  @Column({ name: 'proximaejecucion', type: 'datetime2', precision: 7, nullable: true })
  proximaejecucion?: Date;

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
