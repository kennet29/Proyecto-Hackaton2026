import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'puntajeriesgo' })
export class Puntajeriesgo {
  @PrimaryGeneratedColumn({ name: 'puntajeriesgoid', type: 'int' })
  puntajeriesgoId!: number;

  @Column({ name: 'pacienteid', type: 'int', precision: 10 })
  pacienteId!: number;

  @Column({ name: 'consultaid', type: 'int', precision: 10, nullable: true })
  consultaId?: number;

  @Column({ name: 'tipo', type: 'nvarchar', length: 120 })
  tipo!: string;

  @Column({ name: 'valordecimal', type: 'decimal', precision: 10, scale: 2, nullable: true })
  valordecimal?: number;

  @Column({ name: 'valortexto', type: 'nvarchar', length: 100, nullable: true })
  valortexto?: string;

  @Column({ name: 'unidad', type: 'nvarchar', length: 40, nullable: true })
  unidad?: string;

  @Column({ name: 'rangoreferencia', type: 'nvarchar', length: 80, nullable: true })
  rangoreferencia?: string;

  @Column({ name: 'clasificacion', type: 'nvarchar', length: 80, nullable: true })
  clasificacion?: string;

  @Column({ name: 'fechamedicion', type: 'datetime2', precision: 7 })
  fechamedicion!: Date;

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
