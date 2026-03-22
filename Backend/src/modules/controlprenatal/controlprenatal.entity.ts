import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'controlprenatal' })
export class Controlprenatal {
  @PrimaryGeneratedColumn({ name: 'controlid', type: 'int' })
  controlId!: number;

  @Column({ name: 'embarazoid', type: 'int', precision: 10 })
  embarazoId!: number;

  @Column({ name: 'fechacontrol', type: 'date' })
  fechacontrol!: Date;

  @Column({ name: 'semanagestacion', type: 'int', precision: 10, nullable: true })
  semanagestacion?: number;

  @Column({ name: 'presionarterial', type: 'nvarchar', length: 20, nullable: true })
  presionarterial?: string;

  @Column({ name: 'peso', type: 'decimal', precision: 6, scale: 2, nullable: true })
  peso?: number;

  @Column({ name: 'fetalheartrate', type: 'int', precision: 10, nullable: true })
  fetalheartrate?: number;

  @Column({ name: 'intervenciones', type: 'nvarchar', nullable: true })
  intervenciones?: string;

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
