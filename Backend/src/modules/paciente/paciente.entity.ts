import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * Entidad TypeORM que modela el recurso paciente.
 */
@Entity({ name: "paciente" })
export class Paciente {
  /**
   * Identificador persistido para `pacienteId`.
   */
  @PrimaryGeneratedColumn({ name: "pacienteid", type: "int" })
  pacienteId!: number;

  /**
   * Nombre descriptivo almacenado en `nombres`.
   */
  @Column({ name: "nombres", type: "nvarchar", length: 100 })
  nombres!: string;

  /**
   * Campo de datos asociado a `apellidos`.
   */
  @Column({ name: "apellidos", type: "nvarchar", length: 100 })
  apellidos!: string;

  /**
   * Fecha asociada al campo `fechanacimiento`.
   */
  @Column({ name: "fechanacimiento", type: "date", nullable: true })
  fechanacimiento?: Date;

  /**
   * Campo de datos asociado a `sexo`.
   */
  @Column({ name: "sexo", type: "char", length: 1, nullable: true })
  sexo?: string;

  /**
   * Campo de datos asociado a `tipodocumento`.
   */
  @Column({
    name: "tipodocumento",
    type: "nvarchar",
    length: 30,
    nullable: true,
  })
  tipodocumento?: string;

  /**
   * Campo de datos asociado a `numerodocumento`.
   */
  @Column({
    name: "numerodocumento",
    type: "nvarchar",
    length: 50,
    nullable: true,
  })
  numerodocumento?: string;

  /**
   * Número de contacto asociado a `telefono`.
   */
  @Column({ name: "telefono", type: "nvarchar", length: 30, nullable: true })
  telefono?: string;

  /**
   * Correo electrónico almacenado en `email`.
   */
  @Column({ name: "email", type: "nvarchar", length: 120, nullable: true })
  email?: string;

  /**
   * Campo de datos asociado a `direccion`.
   */
  @Column({ name: "direccion", type: "nvarchar", length: 200, nullable: true })
  direccion?: string;

  /**
   * Fecha asociada al campo `fecharegistro`.
   */
  @Column({ name: "fecharegistro", type: "datetime2", precision: 7 })
  fecharegistro!: Date;

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
