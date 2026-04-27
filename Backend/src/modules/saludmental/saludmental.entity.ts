import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'saludmental' })
export class Saludmental {
  @PrimaryGeneratedColumn({ name: 'saludmentalid', type: 'int' })
  saludmentalId!: number;

  @Column({ name: 'pacienteid', type: 'int', precision: 10 })
  pacienteId!: number;

  @Column({ name: 'fecha', type: 'date' })
  fecha!: Date;

  @Column({ name: 'estadoanimo', type: 'int', precision: 10 })
  estadoAnimo!: number;

  @Column({ name: 'estres', type: 'int', precision: 10 })
  estres!: number;

  @Column({ name: 'ansiedad', type: 'int', precision: 10 })
  ansiedad!: number;

  @Column({ name: 'horassueno', type: 'decimal', precision: 4, scale: 2, nullable: true })
  horasSueno?: number;

  @Column({ name: 'notapersonal', type: 'nvarchar', length: 'max', nullable: true })
  notaPersonal?: string;

  @Column({ name: 'ejerciciominutos', type: 'int', precision: 10, nullable: true })
  ejercicioMinutos?: number;

  @Column({ name: 'hidratacionlitros', type: 'decimal', precision: 4, scale: 2, nullable: true })
  hidratacionLitros?: number;

  @Column({ name: 'descansohoras', type: 'decimal', precision: 4, scale: 2, nullable: true })
  descansoHoras?: number;

  @Column({ name: 'tiemposocialminutos', type: 'int', precision: 10, nullable: true })
  tiempoSocialMinutos?: number;

  @Column({ name: 'pausasdigitales', type: 'int', precision: 10, nullable: true })
  pausasDigitales?: number;

  @Column({ name: 'creadopor', type: 'nvarchar', length: 60, nullable: true })
  creadoPor?: string;

  @Column({ name: 'creadoen', type: 'datetime2', precision: 7 })
  creadoEn!: Date;

  @Column({ name: 'modificadopor', type: 'nvarchar', length: 60, nullable: true })
  modificadoPor?: string;

  @Column({ name: 'modificadoen', type: 'datetime2', precision: 7, nullable: true })
  modificadoEn?: Date;

  @Column({ name: 'campoprueba01', type: 'nvarchar', length: 200, nullable: true })
  campoPrueba01?: string;

  @Column({ name: 'campoprueba02', type: 'nvarchar', length: 200, nullable: true })
  campoPrueba02?: string;

  @Column({ name: 'campoprueba03', type: 'nvarchar', length: 200, nullable: true })
  campoPrueba03?: string;

  @Column({ name: 'campoprueba04', type: 'nvarchar', length: 200, nullable: true })
  campoPrueba04?: string;

  @Column({ name: 'campoprueba05', type: 'nvarchar', length: 200, nullable: true })
  campoPrueba05?: string;
}
