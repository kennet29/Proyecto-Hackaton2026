import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PermisoAcceso } from './permisoacceso.entity';

@Entity({ name: 'permisoacceso_token' })
export class PermisoAccesoToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'token', type: 'nvarchar', length: 128, unique: true })
  token!: string;

  @Column({ name: 'permisoid' })
  permisoId!: number;

  @ManyToOne(() => PermisoAcceso, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permisoid' })
  permiso!: PermisoAcceso;

  @Column({ name: 'expiraen', type: 'datetime2' })
  expiresAt!: Date;

  @Column({ name: 'usado', type: 'bit', default: false })
  used!: boolean;

  @Column({ name: 'usadopor', type: 'int', nullable: true })
  usedBy?: number | null;

  @Column({ name: 'usadoen', type: 'datetime2', nullable: true })
  usedOn?: Date | null;

  @Column({ name: 'creadopor', type: 'nvarchar', length: 60, nullable: true })
  creadoPor?: string | null;

  @CreateDateColumn({ name: 'creadoen', type: 'datetime2', default: () => 'SYSDATETIME()' })
  creadoEn!: Date;

  @UpdateDateColumn({ name: 'modificadoen', type: 'datetime2', nullable: true })
  modificadoEn?: Date | null;
}
