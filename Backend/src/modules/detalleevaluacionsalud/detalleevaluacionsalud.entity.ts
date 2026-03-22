import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'detalleevaluacionsalud' })
export class Detalleevaluacionsalud {
  @PrimaryGeneratedColumn({ name: 'detalleid', type: 'int' })
  detalleId!: number;

  @Column({ name: 'evaluacionid', type: 'int', precision: 10 })
  evaluacionId!: number;

  @Column({ name: 'habitoid', type: 'int', precision: 10, nullable: true })
  habitoId?: number;

  @Column({ name: 'componente', type: 'nvarchar', length: 80, nullable: true })
  componente?: string;

  @Column({ name: 'peso', type: 'decimal', precision: 5, scale: 2, nullable: true })
  peso?: number;

  @Column({ name: 'comentario', type: 'nvarchar', length: 200, nullable: true })
  comentario?: string;

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
