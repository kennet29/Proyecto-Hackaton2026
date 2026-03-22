import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'notificacion' })
export class Notificacion {
  @PrimaryGeneratedColumn({ name: 'notificacionid', type: 'int' })
  notificacionId!: number;

  @Column({ name: 'pacienteid', type: 'int', precision: 10 })
  pacienteId!: number;

  @Column({ name: 'tipo', type: 'nvarchar', length: 80 })
  tipo!: string;

  @Column({ name: 'mensaje', type: 'nvarchar', length: 300 })
  mensaje!: string;

  @Column({ name: 'fechaprogramada', type: 'datetime2', precision: 7 })
  fechaprogramada!: Date;

  @Column({ name: 'enviada', type: 'bit' })
  enviada!: boolean;

  @Column({ name: 'medio', type: 'nvarchar', length: 50, nullable: true })
  medio?: string;

  @Column({ name: 'entidadorigen', type: 'nvarchar', length: 80, nullable: true })
  entidadorigen?: string;

  @Column({ name: 'entidadid', type: 'int', precision: 10, nullable: true })
  entidadId?: number;

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
