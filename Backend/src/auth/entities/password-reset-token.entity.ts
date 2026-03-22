import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Usuario } from '../../users/entities/user.entity';

@Entity({ name: 'passwordresettoken' })
export class PasswordResetToken {
  @PrimaryGeneratedColumn({ name: 'tokenid' })
  id!: number;

  @Column({ name: 'token', length: 100, unique: true })
  token!: string;

  @Column({ name: 'expiracion', type: 'datetime2' })
  expiresAt!: Date;

  @Column({ name: 'usado', type: 'bit', default: false })
  used!: boolean;

  @Column({ name: 'usadooen', type: 'datetime2', nullable: true })
  usedOn?: Date;

  @ManyToOne(() => Usuario, { eager: true })
  @JoinColumn({ name: 'usuarioid' })
  usuario!: Usuario;

  @Column({ name: 'usuarioid' })
  usuarioId!: number;

  @Column({ name: 'creadopor', nullable: true })
  creadoPor?: string;

  @CreateDateColumn({ name: 'creadoen', type: 'datetime2', default: () => 'SYSDATETIME()' })
  creadoEn!: Date;

  @Column({ name: 'modificadopor', nullable: true })
  modificadoPor?: string;

  @UpdateDateColumn({ name: 'modificadoen', type: 'datetime2', nullable: true })
  modificadoEn?: Date;

  @Column({ name: 'campoprueba01', nullable: true })
  campoPrueba01?: string;

  @Column({ name: 'campoprueba02', nullable: true })
  campoPrueba02?: string;

  @Column({ name: 'campoprueba03', nullable: true })
  campoPrueba03?: string;

  @Column({ name: 'campoprueba04', nullable: true })
  campoPrueba04?: string;

  @Column({ name: 'campoprueba05', nullable: true })
  campoPrueba05?: string;
}
