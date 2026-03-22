import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'medicacion' })
export class Medicacion {
  @PrimaryGeneratedColumn({ name: 'medicacionid', type: 'int' })
  medicacionId!: number;

  @Column({ name: 'pacienteid', type: 'int', precision: 10 })
  pacienteId!: number;

  @Column({ name: 'consultaid', type: 'int', precision: 10, nullable: true })
  consultaId?: number;

  @Column({ name: 'nombremedicamento', type: 'nvarchar', length: 150 })
  nombremedicamento!: string;

  @Column({ name: 'presentacion', type: 'nvarchar', length: 100, nullable: true })
  presentacion?: string;

  @Column({ name: 'dosis', type: 'nvarchar', length: 80, nullable: true })
  dosis?: string;

  @Column({ name: 'viaadministracion', type: 'nvarchar', length: 60, nullable: true })
  viaadministracion?: string;

  @Column({ name: 'indicaciones', type: 'nvarchar', nullable: true })
  indicaciones?: string;

  @Column({ name: 'fechainicio', type: 'date' })
  fechainicio!: Date;

  @Column({ name: 'fechafin', type: 'date', nullable: true })
  fechafin?: Date;

  @Column({ name: 'medicacionactiva', type: 'bit' })
  medicacionactiva!: boolean;

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
