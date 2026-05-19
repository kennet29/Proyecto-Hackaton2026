import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Usuario } from "../../users/entities/user.entity";

/**
 * Entidad TypeORM que modela el recurso password reset token.
 */
@Entity({ name: "passwordresettoken" })
export class PasswordResetToken {
  /**
   * Identificador persistido para `id`.
   */
  @PrimaryGeneratedColumn({ name: "tokenid" })
  id!: number;

  /**
   * Campo de datos asociado a `token`.
   */
  @Column({ name: "token", length: 100, unique: true })
  token!: string;

  /**
   * Campo de datos asociado a `expiresAt`.
   */
  @Column({ name: "expiracion", type: "datetime2" })
  expiresAt!: Date;

  /**
   * Campo de datos asociado a `used`.
   */
  @Column({ name: "usado", type: "bit", default: false })
  used!: boolean;

  /**
   * Campo de datos asociado a `usedOn`.
   */
  @Column({ name: "usadooen", type: "datetime2", nullable: true })
  usedOn?: Date;

  /**
   * Campo de datos asociado a `usuario`.
   */
  @ManyToOne(() => Usuario, { eager: true })
  @JoinColumn({ name: "usuarioid" })
  usuario!: Usuario;

  /**
   * Identificador persistido para `usuarioId`.
   */
  @Column({ name: "usuarioid" })
  usuarioId!: number;

  /**
   * Campo de datos asociado a `creadoPor`.
   */
  @Column({ name: "creadopor", nullable: true })
  creadoPor?: string;

  /**
   * Campo de datos asociado a `creadoEn`.
   */
  @CreateDateColumn({
    name: "creadoen",
    type: "datetime2",
    default: () => "SYSDATETIME()",
  })
  creadoEn!: Date;

  /**
   * Campo de datos asociado a `modificadoPor`.
   */
  @Column({ name: "modificadopor", nullable: true })
  modificadoPor?: string;

  /**
   * Campo de datos asociado a `modificadoEn`.
   */
  @UpdateDateColumn({ name: "modificadoen", type: "datetime2", nullable: true })
  modificadoEn?: Date;

  /**
   * Campo de datos asociado a `campoPrueba01`.
   */
  @Column({ name: "campoprueba01", nullable: true })
  campoPrueba01?: string;

  /**
   * Campo de datos asociado a `campoPrueba02`.
   */
  @Column({ name: "campoprueba02", nullable: true })
  campoPrueba02?: string;

  /**
   * Campo de datos asociado a `campoPrueba03`.
   */
  @Column({ name: "campoprueba03", nullable: true })
  campoPrueba03?: string;

  /**
   * Campo de datos asociado a `campoPrueba04`.
   */
  @Column({ name: "campoprueba04", nullable: true })
  campoPrueba04?: string;

  /**
   * Campo de datos asociado a `campoPrueba05`.
   */
  @Column({ name: "campoprueba05", nullable: true })
  campoPrueba05?: string;
}
