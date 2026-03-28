import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Usuario } from '../../users/entities/user.entity';

@Entity({ name: 'tokenrevocado' })
@Unique(['jwtId'])
export class RevokedToken {
  @PrimaryGeneratedColumn({ name: 'tokenrevocadoid' })
  id!: number;

  @Column({ name: 'jti', length: 128 })
  jwtId!: string;

  @Column({ name: 'usuarioid' })
  usuarioId!: number;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuarioid' })
  usuario!: Usuario;

  @Column({ name: 'expira', type: 'datetime2' })
  expiresAt!: Date;

  @Column({ name: 'motivo', length: 120, nullable: true })
  reason?: string;

  @Column({ name: 'creadopor', length: 60, nullable: true })
  creadoPor?: string;

  @CreateDateColumn({ name: 'creadoen', type: 'datetime2', default: () => 'SYSDATETIME()' })
  creadoEn!: Date;

  @Column({ name: 'modificadopor', length: 60, nullable: true })
  modificadoPor?: string;

  @UpdateDateColumn({ name: 'modificadoen', type: 'datetime2', nullable: true })
  modificadoEn?: Date;

}
