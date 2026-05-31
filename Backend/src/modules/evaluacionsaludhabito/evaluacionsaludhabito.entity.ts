import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * Entidad TypeORM que modela el recurso evaluacionsaludhabito.
 */
@Entity({ name: "evaluacionsaludhabito" })
export class Evaluacionsaludhabito {
  /**
   * Identificador persistido para `evaluacionId`.
   */
  @PrimaryGeneratedColumn({ name: "evaluacionid", type: "int" })
  evaluacionId!: number;

  /**
   * Identificador persistido para `pacienteId`.
   */
  @Column({ name: "pacienteid", type: "int", precision: 10 })
  pacienteId!: number;

  /**
   * Fecha asociada al campo `fecha`.
   */
  @Column({ name: "fecha", type: "datetime2", precision: 7 })
  fecha!: Date;

  /**
   * Campo de datos asociado a `puntaje`.
   */
  @Column({ name: "puntaje", type: "decimal", precision: 5, scale: 2 })
  puntaje!: number;

  /**
   * Campo de datos asociado a `categoria`.
   */
  @Column({ name: "categoria", type: "nvarchar", length: 80, nullable: true })
  categoria?: string;

  /**
   * Campo de datos asociado a `resumen`.
   */
  @Column({ name: "resumen", type: "nvarchar", length: 200, nullable: true })
  resumen?: string;

  /**
   * Texto descriptivo del campo `detalle`.
   */
  @Column({ name: "detalle", type: "nvarchar", nullable: true })
  detalle?: string;

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
