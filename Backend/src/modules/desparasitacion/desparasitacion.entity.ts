import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'desparasitacion' })
export class Desparasitacion {
  @PrimaryGeneratedColumn({ name: 'desparasitacionid', type: 'int' })
  desparasitacionId!: number;

  @Column({ name: 'pacienteid', type: 'int', precision: 10 })
  pacienteId!: number;

  @Column({ name: 'fecha', type: 'date' })
  fecha!: Date;

  @Column({ name: 'producto', type: 'nvarchar', length: 150 })
  producto!: string;

  @Column({ name: 'dosis', type: 'nvarchar', length: 80, nullable: true })
  dosis?: string;

  @Column({ name: 'proximafecha', type: 'date', nullable: true })
  proximafecha?: Date;

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
