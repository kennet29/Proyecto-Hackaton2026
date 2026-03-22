import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'operacion' })
export class Operacion {
  @PrimaryGeneratedColumn({ name: 'operacionid', type: 'int' })
  operacionId!: number;

  @Column({ name: 'pacienteid', type: 'int', precision: 10 })
  pacienteId!: number;

  @Column({ name: 'tipooperacionid', type: 'int', precision: 10, nullable: true })
  tipooperacionId?: number;

  @Column({ name: 'fechaoperacion', type: 'date' })
  fechaoperacion!: Date;

  @Column({ name: 'tipo', type: 'nvarchar', length: 150 })
  tipo!: string;

  @Column({ name: 'hospital', type: 'nvarchar', length: 150, nullable: true })
  hospital?: string;

  @Column({ name: 'cirujano', type: 'nvarchar', length: 120, nullable: true })
  cirujano?: string;

  @Column({ name: 'resultado', type: 'nvarchar', nullable: true })
  resultado?: string;

  @Column({ name: 'complicaciones', type: 'nvarchar', nullable: true })
  complicaciones?: string;

  @Column({ name: 'estado', type: 'nvarchar', length: 40 })
  estado!: string;

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
