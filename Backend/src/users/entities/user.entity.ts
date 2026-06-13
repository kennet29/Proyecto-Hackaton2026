import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

/**
 * Entidad TypeORM que modela el recurso usuario.
 */
@Entity({ name: "usuario" })
export class Usuario {
  /**
   * Identificador persistido para `id`.
   */
  @PrimaryGeneratedColumn({ name: "usuarioid" })
  id!: number;

  /**
   * Identificador persistido para `pacienteId`.
   */
  @Column({ name: "pacienteid", nullable: true })
  pacienteId?: number;

  /**
   * Campo de datos asociado a `username`.
   */
  @Column({ name: "nombreusuario" })
  username!: string;

  /**
   * Campo de datos asociado a `city`.
   */
  @Column({ name: "ciudad", length: 100, nullable: true })
  city?: string;

  /**
   * Campo de datos asociado a `country`.
   */
  @Column({ name: "pais", length: 100, nullable: true })
  country?: string;

  /**
   * Campo de datos asociado a `hashPassword`.
   */
  @Column({ name: "hashpassword", type: "varbinary", length: 256 })
  hashPassword!: Buffer;

  /**
   * Campo de datos asociado a `fingerprintHash`.
   */
  @Column({
    name: "huelladigitalhash",
    type: "varbinary",
    length: 64,
    nullable: true,
  })
  fingerprintHash?: Buffer | null;

  /**
   * Campo de datos asociado a `role`.
   */
  @Column({ name: "rolprincipal", default: "paciente" })
  role!: string;

  /**
   * Campo de datos asociado a `activo`.
   */
  @Column({ name: "activo", type: "bit", default: true })
  activo!: boolean;

  /**
   * Campo de datos asociado a `lastLogin`.
   */
  @Column({ name: "ultimoingreso", type: "datetime2", nullable: true })
  lastLogin?: Date;

  /**
   * Fecha asociada al campo `fechaCreacion`.
   */
  @Column({
    name: "fechacreacion",
    type: "datetime2",
    default: () => "SYSDATETIME()",
  })
  fechaCreacion!: Date;

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
}
