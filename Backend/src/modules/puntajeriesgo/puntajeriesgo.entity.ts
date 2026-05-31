import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * Entidad TypeORM que modela el recurso puntajeriesgo.
 */
@Entity({ name: "puntajeriesgo" })
export class Puntajeriesgo {
  /**
   * Identificador persistido para `puntajeriesgoId`.
   */
  @PrimaryGeneratedColumn({ name: "puntajeriesgoid", type: "int" })
  puntajeriesgoId!: number;

  /**
   * Identificador persistido para `pacienteId`.
   */
  @Column({ name: "pacienteid", type: "int", precision: 10 })
  pacienteId!: number;

  /**
   * Identificador persistido para `consultaId`.
   */
  @Column({ name: "consultaid", type: "int", precision: 10, nullable: true })
  consultaId?: number;

  /**
   * Campo de datos asociado a `tipo`.
   */
  @Column({ name: "tipo", type: "nvarchar", length: 120 })
  tipo!: string;

  /**
   * Campo de datos asociado a `valordecimal`.
   */
  @Column({
    name: "valordecimal",
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  valordecimal?: number;

  /**
   * Campo de datos asociado a `valortexto`.
   */
  @Column({ name: "valortexto", type: "nvarchar", length: 100, nullable: true })
  valortexto?: string;

  /**
   * Campo de datos asociado a `unidad`.
   */
  @Column({ name: "unidad", type: "nvarchar", length: 40, nullable: true })
  unidad?: string;

  /**
   * Campo de datos asociado a `rangoreferencia`.
   */
  @Column({
    name: "rangoreferencia",
    type: "nvarchar",
    length: 80,
    nullable: true,
  })
  rangoreferencia?: string;

  /**
   * Campo de datos asociado a `clasificacion`.
   */
  @Column({
    name: "clasificacion",
    type: "nvarchar",
    length: 80,
    nullable: true,
  })
  clasificacion?: string;

  /**
   * Fecha asociada al campo `fechamedicion`.
   */
  @Column({ name: "fechamedicion", type: "datetime2", precision: 7 })
  fechamedicion!: Date;

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
