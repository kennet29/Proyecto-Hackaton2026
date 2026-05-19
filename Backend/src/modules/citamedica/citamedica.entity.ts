import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * Entidad TypeORM que modela el recurso citamedica.
 */
@Entity({ name: "citamedica" })
export class Citamedica {
  /**
   * Identificador persistido para `citaId`.
   */
  @PrimaryGeneratedColumn({ name: "citaid", type: "int" })
  citaId!: number;

  /**
   * Identificador persistido para `pacienteId`.
   */
  @Column({ name: "pacienteid", type: "int", precision: 10 })
  pacienteId!: number;

  /**
   * Identificador persistido para `especialidadId`.
   */
  @Column({
    name: "especialidadid",
    type: "int",
    precision: 10,
    nullable: true,
  })
  especialidadId?: number;

  /**
   * Fecha asociada al campo `fechacita`.
   */
  @Column({ name: "fechacita", type: "datetime2", precision: 7 })
  fechacita!: Date;

  /**
   * Indicador booleano persistido en `especialidad`.
   */
  @Column({
    name: "especialidad",
    type: "nvarchar",
    length: 120,
    nullable: true,
  })
  especialidad?: string;

  /**
   * Campo de datos asociado a `motivo`.
   */
  @Column({ name: "motivo", type: "nvarchar", length: 200, nullable: true })
  motivo?: string;

  /**
   * Campo de datos asociado a `medico`.
   */
  @Column({ name: "medico", type: "nvarchar", length: 120, nullable: true })
  medico?: string;

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
