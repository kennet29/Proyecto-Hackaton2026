import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'habitoespecifico' })
export class Habitoespecifico {
  @PrimaryGeneratedColumn({ name: 'habitoid', type: 'int' })
  habitoId!: number;

  @Column({ name: 'pacienteid', type: 'int', precision: 10 })
  pacienteId!: number;

  @Column({ name: 'tipohabitoid', type: 'int', precision: 10 })
  tipohabitoId!: number;

  @Column({ name: 'categoria', type: 'nvarchar', length: 80, nullable: true })
  categoria?: string;

  @Column({ name: 'nivel', type: 'nvarchar', length: 80, nullable: true })
  nivel?: string;

  @Column({ name: 'frecuencia', type: 'nvarchar', length: 100, nullable: true })
  frecuencia?: string;

  @Column({ name: 'cantidad', type: 'decimal', precision: 10, scale: 2, nullable: true })
  cantidad?: number;

  @Column({ name: 'unidad', type: 'nvarchar', length: 30, nullable: true })
  unidad?: string;

  @Column({ name: 'inicio', type: 'date', nullable: true })
  inicio?: Date;

  @Column({ name: 'fin', type: 'date', nullable: true })
  fin?: Date;

  @Column({ name: 'impactosalud', type: 'nvarchar', length: 150, nullable: true })
  impactosalud?: string;

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
