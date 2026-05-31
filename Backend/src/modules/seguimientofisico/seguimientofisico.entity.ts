import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * Entidad TypeORM que modela el recurso seguimientofisico.
 */
@Entity({ name: "seguimientofisico" })
export class Seguimientofisico {
  /**
   * Identificador persistido para `seguimientoFisicoId`.
   */
  @PrimaryGeneratedColumn({ name: "seguimientofisicoid", type: "int" })
  seguimientoFisicoId!: number;

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
   * Campo de datos asociado a `peso`.
   */
  @Column({
    name: "peso",
    type: "decimal",
    precision: 6,
    scale: 2,
    nullable: true,
  })
  peso?: number | null;

  /**
   * Campo de datos asociado a `minutosEjercicio`.
   */
  @Column({
    name: "minutosejercicio",
    type: "int",
    precision: 10,
    nullable: true,
  })
  minutosEjercicio?: number | null;

  /**
   * Campo de datos asociado a `tipoEjercicio`.
   */
  @Column({
    name: "tipoejercicio",
    type: "nvarchar",
    length: 120,
    nullable: true,
  })
  tipoEjercicio?: string | null;

  /**
   * Campo de datos asociado a `intensidad`.
   */
  @Column({ name: "intensidad", type: "nvarchar", length: 30, nullable: true })
  intensidad?: string | null;

  /**
   * Campo de datos asociado a `pasos`.
   */
  @Column({ name: "pasos", type: "int", precision: 10, nullable: true })
  pasos?: number | null;

  /**
   * Campo de datos asociado a `caloriasQuemadas`.
   */
  @Column({
    name: "caloriasquemadas",
    type: "int",
    precision: 10,
    nullable: true,
  })
  caloriasQuemadas?: number | null;

  /**
   * Campo de datos asociado a `distanciaKm`.
   */
  @Column({
    name: "distanciakm",
    type: "decimal",
    precision: 6,
    scale: 2,
    nullable: true,
  })
  distanciaKm?: number | null;

  /**
   * Campo de datos asociado a `notas`.
   */
  @Column({ name: "notas", type: "nvarchar", length: "max", nullable: true })
  notas?: string | null;

  /**
   * Campo de datos asociado a `creadoPor`.
   */
  @Column({ name: "creadopor", type: "nvarchar", length: 60, nullable: true })
  creadoPor?: string | null;

  /**
   * Campo de datos asociado a `creadoEn`.
   */
  @Column({ name: "creadoen", type: "datetime2", precision: 7 })
  creadoEn!: Date;

  /**
   * Campo de datos asociado a `modificadoPor`.
   */
  @Column({
    name: "modificadopor",
    type: "nvarchar",
    length: 60,
    nullable: true,
  })
  modificadoPor?: string | null;

  /**
   * Campo de datos asociado a `modificadoEn`.
   */
  @Column({
    name: "modificadoen",
    type: "datetime2",
    precision: 7,
    nullable: true,
  })
  modificadoEn?: Date | null;

  /**
   * Campo de datos asociado a `campoPrueba01`.
   */
  @Column({
    name: "campoprueba01",
    type: "nvarchar",
    length: 200,
    nullable: true,
  })
  campoPrueba01?: string | null;

  /**
   * Campo de datos asociado a `campoPrueba02`.
   */
  @Column({
    name: "campoprueba02",
    type: "nvarchar",
    length: 200,
    nullable: true,
  })
  campoPrueba02?: string | null;

  /**
   * Campo de datos asociado a `campoPrueba03`.
   */
  @Column({
    name: "campoprueba03",
    type: "nvarchar",
    length: 200,
    nullable: true,
  })
  campoPrueba03?: string | null;

  /**
   * Campo de datos asociado a `campoPrueba04`.
   */
  @Column({
    name: "campoprueba04",
    type: "nvarchar",
    length: 200,
    nullable: true,
  })
  campoPrueba04?: string | null;

  /**
   * Campo de datos asociado a `campoPrueba05`.
   */
  @Column({
    name: "campoprueba05",
    type: "nvarchar",
    length: 200,
    nullable: true,
  })
  campoPrueba05?: string | null;
}
