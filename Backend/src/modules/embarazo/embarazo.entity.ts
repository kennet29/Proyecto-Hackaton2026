import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * Entidad TypeORM que modela el recurso embarazo.
 */
@Entity({ name: "embarazo" })
export class Embarazo {
  /**
   * Identificador persistido para `embarazoId`.
   */
  @PrimaryGeneratedColumn({ name: "embarazoid", type: "int" })
  embarazoId!: number;

  /**
   * Identificador persistido para `pacienteId`.
   */
  @Column({ name: "pacienteid", type: "int", precision: 10 })
  pacienteId!: number;

  /**
   * Fecha asociada al campo `fechainicio`.
   */
  @Column({ name: "fechainicio", type: "date" })
  fechainicio!: Date;

  /**
   * Fecha asociada al campo `fechaprobableparto`.
   */
  @Column({ name: "fechaprobableparto", type: "date", nullable: true })
  fechaprobableparto?: Date;

  @Column({ name: "metodocalculofpp", type: "nvarchar", length: 80, nullable: true })
  metodoCalculoFpp?: string;

  @Column({ name: "fechaprimerultrasonido", type: "date", nullable: true })
  fechaPrimerUltrasonido?: Date;

  @Column({ name: "edadgestacionalprimerussemanas", type: "int", nullable: true })
  edadGestacionalPrimerUsSemanas?: number;

  @Column({ name: "edadgestacionalprimerusdias", type: "int", nullable: true })
  edadGestacionalPrimerUsDias?: number;

  @Column({ name: "numerofetos", type: "int", nullable: true })
  numeroFetos?: number;

  @Column({ name: "embarazoplanificado", type: "bit", nullable: true })
  embarazoPlanificado?: boolean;

  @Column({ name: "embarazosanteriores", type: "int", nullable: true })
  embarazosAnteriores?: number;

  @Column({ name: "partosanteriores", type: "int", nullable: true })
  partosAnteriores?: number;

  @Column({ name: "abortosanteriores", type: "int", nullable: true })
  abortosAnteriores?: number;

  @Column({ name: "cesareasanteriores", type: "int", nullable: true })
  cesareasAnteriores?: number;

  @Column({ name: "gruposanguineo", type: "nvarchar", length: 3, nullable: true })
  grupoSanguineo?: string;

  @Column({ name: "factorrh", type: "nvarchar", length: 8, nullable: true })
  factorRh?: string;

  @Column({
    name: "antecedentesrelevantes",
    type: "nvarchar",
    length: "max",
    nullable: true,
  })
  antecedentesRelevantes?: string;

  @Column({ name: "medicoresponsable", type: "nvarchar", length: 150, nullable: true })
  medicoResponsable?: string;

  @Column({ name: "centromedico", type: "nvarchar", length: 200, nullable: true })
  centroMedico?: string;

  /**
   * Campo de datos asociado a `numerocontrol`.
   */
  @Column({ name: "numerocontrol", type: "int", precision: 10, nullable: true })
  numerocontrol?: number;

  /**
   * Campo de datos asociado a `riesgo`.
   */
  @Column({ name: "riesgo", type: "nvarchar", length: 100, nullable: true })
  riesgo?: string;

  /**
   * Estado actual registrado en `estado`.
   */
  @Column({ name: "estado", type: "nvarchar", length: 40 })
  estado!: string;

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
