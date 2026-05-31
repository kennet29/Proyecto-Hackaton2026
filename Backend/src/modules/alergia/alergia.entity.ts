import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * Entidad TypeORM que modela el recurso alergia.
 */
@Entity({ name: "alergia" })
export class Alergia {
  /**
   * Identificador persistido para `alergiaId`.
   */
  @PrimaryGeneratedColumn({ name: "alergiaid", type: "int" })
  alergiaId!: number;

  /**
   * Identificador persistido para `pacienteId`.
   */
  @Column({ name: "pacienteid", type: "int", precision: 10 })
  pacienteId!: number;

  /**
   * Campo de datos asociado a `tipo`.
   */
  @Column({ name: "tipo", type: "nvarchar", length: 120 })
  tipo!: string;

  /**
   * Campo de datos asociado a `desencadenante`.
   */
  @Column({
    name: "desencadenante",
    type: "nvarchar",
    length: 200,
    nullable: true,
  })
  desencadenante?: string;

  /**
   * Campo de datos asociado a `severidad`.
   */
  @Column({ name: "severidad", type: "nvarchar", length: 50, nullable: true })
  severidad?: string;

  /**
   * Campo de datos asociado a `reaccion`.
   */
  @Column({ name: "reaccion", type: "nvarchar", nullable: true })
  reaccion?: string;

  /**
   * Campo de datos asociado a `tratamiento`.
   */
  @Column({ name: "tratamiento", type: "nvarchar", nullable: true })
  tratamiento?: string;

  /**
   * Fecha asociada al campo `fechadiagnostico`.
   */
  @Column({ name: "fechadiagnostico", type: "date", nullable: true })
  fechadiagnostico?: Date;

  /**
   * Estado actual registrado en `estado`.
   */
  @Column({ name: "estado", type: "nvarchar", length: 40 })
  estado!: string;

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
