import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * Entidad TypeORM que modela el recurso operacion.
 */
@Entity({ name: "operacion" })
export class Operacion {
  /**
   * Identificador persistido para `operacionId`.
   */
  @PrimaryGeneratedColumn({ name: "operacionid", type: "int" })
  operacionId!: number;

  /**
   * Identificador persistido para `pacienteId`.
   */
  @Column({ name: "pacienteid", type: "int", precision: 10 })
  pacienteId!: number;

  /**
   * Identificador persistido para `tipooperacionId`.
   */
  @Column({
    name: "tipooperacionid",
    type: "int",
    precision: 10,
    nullable: true,
  })
  tipooperacionId?: number;

  /**
   * Fecha asociada al campo `fechaoperacion`.
   */
  @Column({ name: "fechaoperacion", type: "date" })
  fechaoperacion!: Date;

  /**
   * Campo de datos asociado a `tipo`.
   */
  @Column({ name: "tipo", type: "nvarchar", length: 150 })
  tipo!: string;

  /**
   * Campo de datos asociado a `hospital`.
   */
  @Column({ name: "hospital", type: "nvarchar", length: 150, nullable: true })
  hospital?: string;

  /**
   * Campo de datos asociado a `cirujano`.
   */
  @Column({ name: "cirujano", type: "nvarchar", length: 120, nullable: true })
  cirujano?: string;

  /**
   * Campo de datos asociado a `resultado`.
   */
  @Column({ name: "resultado", type: "nvarchar", nullable: true })
  resultado?: string;

  /**
   * Campo de datos asociado a `complicaciones`.
   */
  @Column({ name: "complicaciones", type: "nvarchar", nullable: true })
  complicaciones?: string;

  /**
   * Estado actual registrado en `estado`.
   */
  @Column({ name: "estado", type: "nvarchar", length: 40 })
  estado!: string;

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
