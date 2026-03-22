import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'registrodental' })
export class Registrodental {
  @PrimaryGeneratedColumn({ name: 'registrodentalid', type: 'int' })
  registrodentalId!: number;

  @Column({ name: 'pacienteid', type: 'int', precision: 10 })
  pacienteId!: number;

  @Column({ name: 'fechaatencion', type: 'datetime2', precision: 7 })
  fechaatencion!: Date;

  @Column({ name: 'procedimiento', type: 'nvarchar', length: 200 })
  procedimiento!: string;

  @Column({ name: 'diagnostico', type: 'nvarchar', length: 200, nullable: true })
  diagnostico?: string;

  @Column({ name: 'odontologo', type: 'nvarchar', length: 120, nullable: true })
  odontologo?: string;

  @Column({ name: 'piezastratadas', type: 'nvarchar', length: 100, nullable: true })
  piezastratadas?: string;

  @Column({ name: 'notas', type: 'nvarchar', nullable: true })
  notas?: string;

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
