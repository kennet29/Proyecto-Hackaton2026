import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * Entidad TypeORM que modela el recurso registrodental.
 */
@Entity({ name: "registrodental" })
export class Registrodental {
  /**
   * Identificador persistido para `registrodentalId`.
   */
  @PrimaryGeneratedColumn({ name: "registrodentalid", type: "int" })
  registrodentalId!: number;

  /**
   * Identificador persistido para `pacienteId`.
   */
  @Column({ name: "pacienteid", type: "int", precision: 10 })
  pacienteId!: number;

  /**
   * Fecha asociada al campo `fechaatencion`.
   */
  @Column({ name: "fechaatencion", type: "datetime2", precision: 7 })
  fechaatencion!: Date;

  /**
   * Campo de datos asociado a `procedimiento`.
   */
  @Column({ name: "procedimiento", type: "nvarchar", length: 200 })
  procedimiento!: string;

  /**
   * Campo de datos asociado a `diagnostico`.
   */
  @Column({
    name: "diagnostico",
    type: "nvarchar",
    length: 200,
    nullable: true,
  })
  diagnostico?: string;

  /**
   * Campo de datos asociado a `odontologo`.
   */
  @Column({ name: "odontologo", type: "nvarchar", length: 120, nullable: true })
  odontologo?: string;

  /**
   * Campo de datos asociado a `piezastratadas`.
   */
  @Column({
    name: "piezastratadas",
    type: "nvarchar",
    length: 100,
    nullable: true,
  })
  piezastratadas?: string;

  /**
   * Campo de datos asociado a `notas`.
   */
  @Column({ name: "notas", type: "nvarchar", nullable: true })
  notas?: string;

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
