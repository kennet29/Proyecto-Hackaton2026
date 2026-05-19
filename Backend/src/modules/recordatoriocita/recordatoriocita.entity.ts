import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * Entidad TypeORM que modela el recurso recordatoriocita.
 */
@Entity({ name: "recordatoriocita" })
export class Recordatoriocita {
  /**
   * Identificador persistido para `recordatoriocitaId`.
   */
  @PrimaryGeneratedColumn({ name: "recordatoriocitaid", type: "int" })
  recordatoriocitaId!: number;

  /**
   * Identificador persistido para `citaId`.
   */
  @Column({ name: "citaid", type: "int", precision: 10 })
  citaId!: number;

  /**
   * Identificador persistido para `pacienteId`.
   */
  @Column({ name: "pacienteid", type: "int", precision: 10 })
  pacienteId!: number;

  /**
   * Fecha asociada al campo `fecharecordatorio`.
   */
  @Column({ name: "fecharecordatorio", type: "datetime2", precision: 7 })
  fecharecordatorio!: Date;

  /**
   * Campo de datos asociado a `mensaje`.
   */
  @Column({ name: "mensaje", type: "nvarchar", length: 300 })
  mensaje!: string;

  /**
   * Campo de datos asociado a `canal`.
   */
  @Column({ name: "canal", type: "nvarchar", length: 50, nullable: true })
  canal?: string;

  /**
   * Estado actual registrado en `estado`.
   */
  @Column({ name: "estado", type: "nvarchar", length: 30 })
  estado!: string;

  /**
   * Campo de datos asociado a `intentos`.
   */
  @Column({ name: "intentos", type: "int", precision: 10 })
  intentos!: number;

  /**
   * Campo de datos asociado a `ultimointento`.
   */
  @Column({
    name: "ultimointento",
    type: "datetime2",
    precision: 7,
    nullable: true,
  })
  ultimointento?: Date;

  /**
   * Campo de datos asociado a `proximaejecucion`.
   */
  @Column({
    name: "proximaejecucion",
    type: "datetime2",
    precision: 7,
    nullable: true,
  })
  proximaejecucion?: Date;

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
