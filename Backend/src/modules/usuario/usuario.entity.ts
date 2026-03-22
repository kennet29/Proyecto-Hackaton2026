import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'usuario' })
export class Usuario {
  @PrimaryGeneratedColumn({ name: 'usuarioid', type: 'int' })
  usuarioId!: number;

  @Column({ name: 'pacienteid', type: 'int', precision: 10, nullable: true })
  pacienteId?: number;

  @Column({ name: 'nombreusuario', type: 'nvarchar', length: 60 })
  nombreusuario!: string;

  @Column({ name: 'hashpassword', type: 'varbinary', length: 256 })
  hashpassword!: Buffer;

  @Column({ name: 'rolprincipal', type: 'nvarchar', length: 40 })
  rolprincipal!: string;

  @Column({ name: 'activo', type: 'bit' })
  activo!: boolean;

  @Column({ name: 'ultimoingreso', type: 'datetime2', precision: 7, nullable: true })
  ultimoingreso?: Date;

  @Column({ name: 'fechacreacion', type: 'datetime2', precision: 7 })
  fechacreacion!: Date;

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
