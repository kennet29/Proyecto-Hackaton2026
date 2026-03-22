import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'adherenciacronica' })
export class Adherenciacronica {
  @PrimaryGeneratedColumn({ name: 'adherenciacronicaid', type: 'int' })
  adherenciacronicaId!: number;

  @Column({ name: 'condicioncronicaid', type: 'int', precision: 10 })
  condicioncronicaId!: number;

  @Column({ name: 'medicacionid', type: 'int', precision: 10, nullable: true })
  medicacionId?: number;

  @Column({ name: 'fechaevento', type: 'datetime2', precision: 7 })
  fechaevento!: Date;

  @Column({ name: 'tipo', type: 'nvarchar', length: 60 })
  tipo!: string;

  @Column({ name: 'porcentaje', type: 'decimal', precision: 5, scale: 2, nullable: true })
  porcentaje?: number;

  @Column({ name: 'estado', type: 'nvarchar', length: 40, nullable: true })
  estado?: string;

  @Column({ name: 'descripcion', type: 'nvarchar', length: 200, nullable: true })
  descripcion?: string;

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
