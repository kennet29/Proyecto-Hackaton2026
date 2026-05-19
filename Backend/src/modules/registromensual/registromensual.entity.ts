import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * Entidad TypeORM que modela el recurso registromensual.
 */
@Entity({ name: "registromensual" })
export class Registromensual {
  /**
   * Identificador persistido para `registromensualId`.
   */
  @PrimaryGeneratedColumn({ name: "registromensualid", type: "int" })
  registromensualId!: number;

  /**
   * Identificador persistido para `pacienteId`.
   */
  @Column({ name: "pacienteid", type: "int", precision: 10 })
  pacienteId!: number;

  /**
   * Campo de datos asociado a `mes`.
   */
  @Column({ name: "mes", type: "int", precision: 10, nullable: true })
  mes?: number;

  /**
   * Campo de datos asociado a `anio`.
   */
  @Column({ name: "anio", type: "int", precision: 10 })
  anio!: number;

  /**
   * Fecha asociada al campo `fechainicio`.
   */
  @Column({ name: "fechainicio", type: "date" })
  fechainicio!: Date;

  /**
   * Campo de datos asociado a `duraciondias`.
   */
  @Column({ name: "duraciondias", type: "int", precision: 10, nullable: true })
  duraciondias?: number;

  /**
   * Campo de datos asociado a `dolor`.
   */
  @Column({ name: "dolor", type: "nvarchar", length: 100, nullable: true })
  dolor?: string;

  /**
   * Campo de datos asociado a `sintomas`.
   */
  @Column({ name: "sintomas", type: "nvarchar", nullable: true })
  sintomas?: string;

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
