import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * Entidad TypeORM que modela el recurso documentoclinico.
 */
@Entity({ name: "documentoclinico" })
export class Documentoclinico {
  /**
   * Identificador persistido para `documentoId`.
   */
  @PrimaryGeneratedColumn({ name: "documentoid", type: "int" })
  documentoId!: number;

  /**
   * Identificador persistido para `pacienteId`.
   */
  @Column({ name: "pacienteid", type: "int", precision: 10 })
  pacienteId!: number;

  /**
   * Identificador persistido para `tipodocumentoId`.
   */
  @Column({ name: "tipodocumentoid", type: "int", precision: 10 })
  tipodocumentoId!: number;

  /**
   * Campo de datos asociado a `entidadorigen`.
   */
  @Column({ name: "entidadorigen", type: "nvarchar", length: 80 })
  entidadorigen!: string;

  /**
   * Identificador persistido para `entidadId`.
   */
  @Column({ name: "entidadid", type: "int", precision: 10, nullable: true })
  entidadId?: number;

  /**
   * Campo de datos asociado a `rutaarchivo`.
   */
  @Column({
    name: "rutaarchivo",
    type: "nvarchar",
    length: 260,
    nullable: true,
  })
  rutaarchivo?: string;

  /**
   * Campo de datos asociado a `urlexterna`.
   */
  @Column({ name: "urlexterna", type: "nvarchar", length: 300, nullable: true })
  urlexterna?: string;

  /**
   * Fecha asociada al campo `fechadocumento`.
   */
  @Column({ name: "fechadocumento", type: "date", nullable: true })
  fechadocumento?: Date;

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
