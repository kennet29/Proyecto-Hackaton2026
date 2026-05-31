import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * Entidad TypeORM que modela el recurso notificacion.
 */
@Entity({ name: "notificacion" })
export class Notificacion {
  /**
   * Identificador persistido para `notificacionId`.
   */
  @PrimaryGeneratedColumn({ name: "notificacionid", type: "int" })
  notificacionId!: number;

  /**
   * Identificador persistido para `pacienteId`.
   */
  @Column({ name: "pacienteid", type: "int", precision: 10 })
  pacienteId!: number;

  /**
   * Campo de datos asociado a `tipo`.
   */
  @Column({ name: "tipo", type: "nvarchar", length: 80 })
  tipo!: string;

  /**
   * Campo de datos asociado a `mensaje`.
   */
  @Column({ name: "mensaje", type: "nvarchar", length: 300 })
  mensaje!: string;

  /**
   * Fecha asociada al campo `fechaprogramada`.
   */
  @Column({ name: "fechaprogramada", type: "datetime2", precision: 7 })
  fechaprogramada!: Date;

  /**
   * Campo de datos asociado a `enviada`.
   */
  @Column({ name: "enviada", type: "bit" })
  enviada!: boolean;

  /**
   * Campo de datos asociado a `medio`.
   */
  @Column({ name: "medio", type: "nvarchar", length: 50, nullable: true })
  medio?: string;

  /**
   * Campo de datos asociado a `entidadorigen`.
   */
  @Column({
    name: "entidadorigen",
    type: "nvarchar",
    length: 80,
    nullable: true,
  })
  entidadorigen?: string;

  /**
   * Identificador persistido para `entidadId`.
   */
  @Column({ name: "entidadid", type: "int", precision: 10, nullable: true })
  entidadId?: number;

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
