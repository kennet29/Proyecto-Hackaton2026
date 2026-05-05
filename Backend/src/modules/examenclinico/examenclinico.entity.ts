import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'examenclinico' })
export class Examenclinico {
  @PrimaryGeneratedColumn({ name: 'examenclinicoid', type: 'int' })
  examenclinicoId!: number;

  @Column({ name: 'pacienteid', type: 'int', precision: 10 })
  pacienteId!: number;

  @Column({ name: 'consultaid', type: 'int', precision: 10, nullable: true })
  consultaId?: number | null;

  @Column({ name: 'nombreexamen', type: 'nvarchar', length: 160 })
  nombreExamen!: string;

  @Column({ name: 'tipoexamen', type: 'nvarchar', length: 120, nullable: true })
  tipoExamen?: string | null;

  @Column({ name: 'laboratorio', type: 'nvarchar', length: 160, nullable: true })
  laboratorio?: string | null;

  @Column({ name: 'fechaexamen', type: 'date' })
  fechaExamen!: Date;

  @Column({ name: 'fecharesultado', type: 'date', nullable: true })
  fechaResultado?: Date | null;

  @Column({ name: 'resultadotexto', type: 'nvarchar', length: 'max', nullable: true })
  resultadoTexto?: string | null;

  @Column({ name: 'observaciones', type: 'nvarchar', length: 'max', nullable: true })
  observaciones?: string | null;

  @Column({ name: 'archivopdf', type: 'varbinary', nullable: true, select: false })
  archivoPdf?: Buffer | null;

  @Column({ name: 'nombrearchivopdf', type: 'nvarchar', length: 260, nullable: true })
  nombreArchivoPdf?: string | null;

  @Column({ name: 'mimearchivopdf', type: 'nvarchar', length: 100, nullable: true })
  mimeArchivoPdf?: string | null;

  @Column({ name: 'creadopor', type: 'nvarchar', length: 60, nullable: true })
  creadoPor?: string | null;

  @Column({ name: 'creadoen', type: 'datetime2', precision: 7 })
  creadoEn!: Date;

  @Column({ name: 'modificadopor', type: 'nvarchar', length: 60, nullable: true })
  modificadoPor?: string | null;

  @Column({ name: 'modificadoen', type: 'datetime2', precision: 7, nullable: true })
  modificadoEn?: Date | null;

  @Column({ name: 'campoprueba01', type: 'nvarchar', length: 200, nullable: true })
  campoPrueba01?: string | null;

  @Column({ name: 'campoprueba02', type: 'nvarchar', length: 200, nullable: true })
  campoPrueba02?: string | null;

  @Column({ name: 'campoprueba03', type: 'nvarchar', length: 200, nullable: true })
  campoPrueba03?: string | null;

  @Column({ name: 'campoprueba04', type: 'nvarchar', length: 200, nullable: true })
  campoPrueba04?: string | null;

  @Column({ name: 'campoprueba05', type: 'nvarchar', length: 200, nullable: true })
  campoPrueba05?: string | null;
}
