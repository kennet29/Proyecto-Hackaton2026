import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * Entidad TypeORM que modela el recurso desparasitacion.
 */
@Entity({ name: "desparasitacion" })
export class Desparasitacion {
  /**
   * Identificador persistido para `desparasitacionId`.
   */
  @PrimaryGeneratedColumn({ name: "desparasitacionid", type: "int" })
  desparasitacionId!: number;

  /**
   * Identificador persistido para `pacienteId`.
   */
  @Column({ name: "pacienteid", type: "int", precision: 10 })
  pacienteId!: number;

  /**
   * Fecha asociada al campo `fecha`.
   */
  @Column({ name: "fecha", type: "date" })
  fecha!: Date;

  /**
   * Campo de datos asociado a `producto`.
   */
  @Column({ name: "producto", type: "nvarchar", length: 150 })
  producto!: string;

  /**
   * Campo de datos asociado a `dosis`.
   */
  @Column({ name: "dosis", type: "nvarchar", length: 80, nullable: true })
  dosis?: string;

  /**
   * Fecha asociada al campo `proximafecha`.
   */
  @Column({ name: "proximafecha", type: "date", nullable: true })
  proximafecha?: Date;

  /**
   * Texto descriptivo del campo `observaciones`.
   */
  @Column({ name: "observaciones", type: "nvarchar", nullable: true })
  observaciones?: string;

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
