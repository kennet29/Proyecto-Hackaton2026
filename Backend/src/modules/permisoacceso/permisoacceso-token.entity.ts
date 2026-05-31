import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { PermisoAcceso } from "./permisoacceso.entity";

/**
 * Entidad TypeORM que modela el recurso permiso acceso token.
 */
@Entity({ name: "permisoacceso_token" })
export class PermisoAccesoToken {
  /**
   * Identificador persistido para `id`.
   */
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  /**
   * Campo de datos asociado a `token`.
   */
  @Column({ name: "token", type: "nvarchar", length: 128, unique: true })
  token!: string;

  /**
   * Identificador persistido para `permisoId`.
   */
  @Column({ name: "permisoid" })
  permisoId!: number;

  /**
   * Campo de datos asociado a `permiso`.
   */
  @ManyToOne(() => PermisoAcceso, { onDelete: "CASCADE" })
  @JoinColumn({ name: "permisoid" })
  permiso!: PermisoAcceso;

  /**
   * Campo de datos asociado a `expiresAt`.
   */
  @Column({ name: "expiraen", type: "datetime2" })
  expiresAt!: Date;

  /**
   * Campo de datos asociado a `used`.
   */
  @Column({ name: "usado", type: "bit", default: false })
  used!: boolean;

  /**
   * Campo de datos asociado a `usedBy`.
   */
  @Column({ name: "usadopor", type: "int", nullable: true })
  usedBy?: number | null;

  /**
   * Campo de datos asociado a `usedOn`.
   */
  @Column({ name: "usadoen", type: "datetime2", nullable: true })
  usedOn?: Date | null;

  /**
   * Campo de datos asociado a `creadoPor`.
   */
  @Column({ name: "creadopor", type: "nvarchar", length: 60, nullable: true })
  creadoPor?: string | null;

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
   * Campo de datos asociado a `modificadoEn`.
   */
  @UpdateDateColumn({ name: "modificadoen", type: "datetime2", nullable: true })
  modificadoEn?: Date | null;
}
