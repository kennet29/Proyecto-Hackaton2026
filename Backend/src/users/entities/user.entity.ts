import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'usuario' })
export class Usuario {
  @PrimaryGeneratedColumn({ name: 'usuarioid' })
  id!: number;

  @Column({ name: 'pacienteid', nullable: true })
  pacienteId?: number;

  @Column({ name: 'nombreusuario' })
  username!: string;

  @Column({ name: 'hashpassword', type: 'varbinary', length: 256 })
  hashPassword!: Buffer;

  @Column({ name: 'huelladigitalhash', type: 'varbinary', length: 64, nullable: true })
  fingerprintHash?: Buffer | null;

  @Column({ name: 'rolprincipal', default: 'paciente' })
  role!: string;

  @Column({ name: 'activo', type: 'bit', default: true })
  activo!: boolean;

  @Column({ name: 'ultimoingreso', type: 'datetime2', nullable: true })
  lastLogin?: Date;

  @Column({ name: 'fechacreacion', type: 'datetime2', default: () => 'SYSDATETIME()' })
  fechaCreacion!: Date;

  @Column({ name: 'creadopor', nullable: true })
  creadoPor?: string;

  @CreateDateColumn({ name: 'creadoen', type: 'datetime2', default: () => 'SYSDATETIME()' })
  creadoEn!: Date;

  @Column({ name: 'modificadopor', nullable: true })
  modificadoPor?: string;

  @UpdateDateColumn({ name: 'modificadoen', type: 'datetime2', nullable: true })
  modificadoEn?: Date;
}
