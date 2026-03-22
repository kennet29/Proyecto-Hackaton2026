import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'objetivocronico' })
export class Objetivocronico {
  @PrimaryGeneratedColumn({ name: 'objetivocronicoid', type: 'int' })
  objetivocronicoId!: number;

  @Column({ name: 'condicioncronicaid', type: 'int', precision: 10 })
  condicioncronicaId!: number;

  @Column({ name: 'descripcion', type: 'nvarchar', length: 200 })
  descripcion!: string;

  @Column({ name: 'indicador', type: 'nvarchar', length: 120, nullable: true })
  indicador?: string;

  @Column({ name: 'valormeta', type: 'decimal', precision: 10, scale: 2, nullable: true })
  valormeta?: number;

  @Column({ name: 'unidad', type: 'nvarchar', length: 40, nullable: true })
  unidad?: string;

  @Column({ name: 'fechalimite', type: 'date', nullable: true })
  fechalimite?: Date;

  @Column({ name: 'estado', type: 'nvarchar', length: 40 })
  estado!: string;

  @Column({ name: 'cumplido', type: 'bit' })
  cumplido!: boolean;

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
