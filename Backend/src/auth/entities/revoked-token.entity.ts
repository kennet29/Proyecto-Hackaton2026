import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm";
import { Usuario } from "../../users/entities/user.entity";

/**
 * Entidad TypeORM que modela el recurso revoked token.
 */
@Entity({ name: "tokenrevocado" })
@Unique(["jwtId"])
export class RevokedToken {
  /**
   * Identificador persistido para `id`.
   */
  @PrimaryGeneratedColumn({ name: "tokenrevocadoid" })
  id!: number;

  /**
   * Identificador persistido para `jwtId`.
   */
  @Column({ name: "jti", length: 128 })
  jwtId!: string;

  /**
   * Identificador persistido para `usuarioId`.
   */
  @Column({ name: "usuarioid" })
  usuarioId!: number;

  /**
   * Campo de datos asociado a `usuario`.
   */
  @ManyToOne(() => Usuario, { onDelete: "CASCADE" })
  @JoinColumn({ name: "usuarioid" })
  usuario!: Usuario;

  /**
   * Campo de datos asociado a `expiresAt`.
   */
  @Column({ name: "expira", type: "datetime2" })
  expiresAt!: Date;

  /**
   * Campo de datos asociado a `reason`.
   */
  @Column({ name: "motivo", length: 120, nullable: true })
  reason?: string;

  /**
   * Campo de datos asociado a `creadoPor`.
   */
  @Column({ name: "creadopor", length: 60, nullable: true })
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
  @Column({ name: "modificadopor", length: 60, nullable: true })
  modificadoPor?: string;

  /**
   * Campo de datos asociado a `modificadoEn`.
   */
  @UpdateDateColumn({ name: "modificadoen", type: "datetime2", nullable: true })
  modificadoEn?: Date;
}
