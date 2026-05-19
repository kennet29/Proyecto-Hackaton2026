import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * Entidad TypeORM que modela el recurso usuario.
 */
@Entity({ name: "usuario" })
export class Usuario {
  /**
   * Identificador persistido para `usuarioId`.
   */
  @PrimaryGeneratedColumn({ name: "usuarioid", type: "int" })
  usuarioId!: number;

  /**
   * Identificador persistido para `pacienteId`.
   */
  @Column({ name: "pacienteid", type: "int", precision: 10, nullable: true })
  pacienteId?: number;

  /**
   * Nombre descriptivo almacenado en `nombreusuario`.
   */
  @Column({ name: "nombreusuario", type: "nvarchar", length: 60 })
  nombreusuario!: string;

  /**
   * Campo de datos asociado a `hashpassword`.
   */
  @Column({ name: "hashpassword", type: "varbinary", length: 256 })
  hashpassword!: Buffer;

  /**
   * Campo de datos asociado a `rolprincipal`.
   */
  @Column({ name: "rolprincipal", type: "nvarchar", length: 40 })
  rolprincipal!: string;

  /**
   * Campo de datos asociado a `activo`.
   */
  @Column({ name: "activo", type: "bit" })
  activo!: boolean;

  /**
   * Campo de datos asociado a `ultimoingreso`.
   */
  @Column({
    name: "ultimoingreso",
    type: "datetime2",
    precision: 7,
    nullable: true,
  })
  ultimoingreso?: Date;

  /**
   * Fecha asociada al campo `fechacreacion`.
   */
  @Column({ name: "fechacreacion", type: "datetime2", precision: 7 })
  fechacreacion!: Date;

  /**
   * Campo de datos asociado a `creadopor`.
   */
  @Column({ name: "creadopor", type: "nvarchar", length: 60, nullable: true })
  creadopor?: string;

  /**
   * Campo de datos asociado a `creadoen`.
   */
  @Column({ name: "creadoen", type: "datetime2", precision: 7 })
  creadoen!: Date;

  /**
   * Campo de datos asociado a `modificadopor`.
   */
  @Column({
    name: "modificadopor",
    type: "nvarchar",
    length: 60,
    nullable: true,
  })
  modificadopor?: string;

  /**
   * Campo de datos asociado a `modificadoen`.
   */
  @Column({
    name: "modificadoen",
    type: "datetime2",
    precision: 7,
    nullable: true,
  })
  modificadoen?: Date;

  /**
   * Campo de datos asociado a `campoprueba01`.
   */
  @Column({
    name: "campoprueba01",
    type: "nvarchar",
    length: 200,
    nullable: true,
  })
  campoprueba01?: string;

  /**
   * Campo de datos asociado a `campoprueba02`.
   */
  @Column({
    name: "campoprueba02",
    type: "nvarchar",
    length: 200,
    nullable: true,
  })
  campoprueba02?: string;

  /**
   * Campo de datos asociado a `campoprueba03`.
   */
  @Column({
    name: "campoprueba03",
    type: "nvarchar",
    length: 200,
    nullable: true,
  })
  campoprueba03?: string;

  /**
   * Campo de datos asociado a `campoprueba04`.
   */
  @Column({
    name: "campoprueba04",
    type: "nvarchar",
    length: 200,
    nullable: true,
  })
  campoprueba04?: string;

  /**
   * Campo de datos asociado a `campoprueba05`.
   */
  @Column({
    name: "campoprueba05",
    type: "nvarchar",
    length: 200,
    nullable: true,
  })
  campoprueba05?: string;
}
