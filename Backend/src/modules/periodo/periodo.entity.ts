import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * Entidad TypeORM que modela el recurso periodo.
 */
@Entity({ name: "periodo" })
export class Periodo {
  /**
   * Identificador persistido para `periodoId`.
   */
  @PrimaryGeneratedColumn({ name: "periodoid", type: "int" })
  periodoId!: number;

  /**
   * Identificador persistido para `pacienteId`.
   */
  @Column({ name: "pacienteid", type: "int", precision: 10 })
  pacienteId!: number;

  /**
   * Fecha asociada al campo `fechaInicio`.
   */
  @Column({ name: "fechainicio", type: "date" })
  fechaInicio!: Date;

  /**
   * Fecha asociada al campo `fechaFin`.
   */
  @Column({ name: "fechafin", type: "date", nullable: true })
  fechaFin?: Date;

  /**
   * Campo de datos asociado a `duracionDias`.
   */
  @Column({ name: "duraciondias", type: "int", precision: 10, nullable: true })
  duracionDias?: number;

  /**
   * Campo de datos asociado a `cicloDias`.
   */
  @Column({ name: "ciclodias", type: "int", precision: 10, nullable: true })
  cicloDias?: number;

  /**
   * Campo de datos asociado a `flujo`.
   */
  @Column({ name: "flujo", type: "nvarchar", length: 30, nullable: true })
  flujo?: string;

  /**
   * Campo de datos asociado a `dolor`.
   */
  @Column({ name: "dolor", type: "nvarchar", length: 100, nullable: true })
  dolor?: string;

  /**
   * Campo de datos asociado a `sintomas`.
   */
  @Column({ name: "sintomas", type: "nvarchar", length: "max", nullable: true })
  sintomas?: string;

  /**
   * Texto descriptivo del campo `observaciones`.
   */
  @Column({
    name: "observaciones",
    type: "nvarchar",
    length: "max",
    nullable: true,
  })
  observaciones?: string;

  /**
   * Campo de datos asociado a `creadoPor`.
   */
  @Column({ name: "creadopor", type: "nvarchar", length: 60, nullable: true })
  creadoPor?: string;

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
  modificadoPor?: string;

  /**
   * Campo de datos asociado a `modificadoEn`.
   */
  @Column({
    name: "modificadoen",
    type: "datetime2",
    precision: 7,
    nullable: true,
  })
  modificadoEn?: Date;

  /**
   * Campo de datos asociado a `campoPrueba01`.
   */
  @Column({
    name: "campoprueba01",
    type: "nvarchar",
    length: 200,
    nullable: true,
  })
  campoPrueba01?: string;

  /**
   * Campo de datos asociado a `campoPrueba02`.
   */
  @Column({
    name: "campoprueba02",
    type: "nvarchar",
    length: 200,
    nullable: true,
  })
  campoPrueba02?: string;

  /**
   * Campo de datos asociado a `campoPrueba03`.
   */
  @Column({
    name: "campoprueba03",
    type: "nvarchar",
    length: 200,
    nullable: true,
  })
  campoPrueba03?: string;

  /**
   * Campo de datos asociado a `campoPrueba04`.
   */
  @Column({
    name: "campoprueba04",
    type: "nvarchar",
    length: 200,
    nullable: true,
  })
  campoPrueba04?: string;

  /**
   * Campo de datos asociado a `campoPrueba05`.
   */
  @Column({
    name: "campoprueba05",
    type: "nvarchar",
    length: 200,
    nullable: true,
  })
  campoPrueba05?: string;
}
