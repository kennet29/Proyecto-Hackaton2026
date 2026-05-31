import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * Entidad TypeORM que modela el recurso horariomedicamento.
 */
@Entity({ name: "horariomedicamento" })
export class Horariomedicamento {
  /**
   * Identificador persistido para `horariomedicamentoId`.
   */
  @PrimaryGeneratedColumn({ name: "horariomedicamentoid", type: "int" })
  horariomedicamentoId!: number;

  /**
   * Identificador persistido para `medicacionId`.
   */
  @Column({ name: "medicacionid", type: "int", precision: 10 })
  medicacionId!: number;

  /**
   * Campo de datos asociado a `horaprogramada`.
   */
  @Column({ name: "horaprogramada", type: "time", precision: 7 })
  horaprogramada!: Date;

  /**
   * Campo de datos asociado a `frecuencia`.
   */
  @Column({ name: "frecuencia", type: "nvarchar", length: 80, nullable: true })
  frecuencia?: string;

  /**
   * Campo de datos asociado a `diasemana`.
   */
  @Column({ name: "diasemana", type: "tinyint", precision: 3, nullable: true })
  diasemana?: number;

  /**
   * Campo de datos asociado a `generarecordatorio`.
   */
  @Column({ name: "generarecordatorio", type: "bit" })
  generarecordatorio!: boolean;

  /**
   * Campo de datos asociado a `proximaalarma`.
   */
  @Column({
    name: "proximaalarma",
    type: "datetime2",
    precision: 7,
    nullable: true,
  })
  proximaalarma?: Date;

  /**
   * Estado actual registrado en `estadorecordatorio`.
   */
  @Column({ name: "estadorecordatorio", type: "nvarchar", length: 30 })
  estadorecordatorio!: string;

  /**
   * Campo de datos asociado a `ultimoenvio`.
   */
  @Column({
    name: "ultimoenvio",
    type: "datetime2",
    precision: 7,
    nullable: true,
  })
  ultimoenvio?: Date;

  /**
   * Texto descriptivo del campo `observaciones`.
   */
  @Column({
    name: "observaciones",
    type: "nvarchar",
    length: 300,
    nullable: true,
  })
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
