import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * Entidad TypeORM que modela el recurso vacuna.
 */
@Entity({ name: "vacuna" })
export class Vacuna {
  /**
   * Identificador persistido para `vacunaId`.
   */
  @PrimaryGeneratedColumn({ name: "vacunaid", type: "int" })
  vacunaId!: number;

  /**
   * Identificador persistido para `pacienteId`.
   */
  @Column({ name: "pacienteid", type: "int", precision: 10 })
  pacienteId!: number;

  /**
   * Identificador persistido para `tipovacunaId`.
   */
  @Column({ name: "tipovacunaid", type: "int", precision: 10, nullable: true })
  tipovacunaId?: number;

  /**
   * Nombre descriptivo almacenado en `nombre`.
   */
  @Column({ name: "nombre", type: "nvarchar", length: 150 })
  nombre!: string;

  /**
   * Fecha asociada al campo `fechaaplicacion`.
   */
  @Column({ name: "fechaaplicacion", type: "date" })
  fechaaplicacion!: Date;

  /**
   * Campo de datos asociado a `lote`.
   */
  @Column({ name: "lote", type: "nvarchar", length: 60, nullable: true })
  lote?: string;

  /**
   * Campo de datos asociado a `proximadosis`.
   */
  @Column({ name: "proximadosis", type: "date", nullable: true })
  proximadosis?: Date;

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
