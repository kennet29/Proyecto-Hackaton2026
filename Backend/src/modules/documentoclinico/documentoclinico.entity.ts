import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'documentoclinico' })
export class Documentoclinico {
  @PrimaryGeneratedColumn({ name: 'documentoid', type: 'int' })
  documentoId!: number;

  @Column({ name: 'pacienteid', type: 'int', precision: 10 })
  pacienteId!: number;

  @Column({ name: 'tipodocumentoid', type: 'int', precision: 10 })
  tipodocumentoId!: number;

  @Column({ name: 'entidadorigen', type: 'nvarchar', length: 80 })
  entidadorigen!: string;

  @Column({ name: 'entidadid', type: 'int', precision: 10, nullable: true })
  entidadId?: number;

  @Column({ name: 'rutaarchivo', type: 'nvarchar', length: 260, nullable: true })
  rutaarchivo?: string;

  @Column({ name: 'urlexterna', type: 'nvarchar', length: 300, nullable: true })
  urlexterna?: string;

  @Column({ name: 'fechadocumento', type: 'date', nullable: true })
  fechadocumento?: Date;

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
