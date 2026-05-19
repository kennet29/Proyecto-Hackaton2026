import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * Entidad TypeORM que modela el recurso saludmental.
 */
@Entity({ name: "saludmental" })
export class Saludmental {
  /**
   * Identificador persistido para `saludmentalId`.
   */
  @PrimaryGeneratedColumn({ name: "saludmentalid", type: "int" })
  saludmentalId!: number;

  /**
   * Identificador persistido para `pacienteId`.
   */
  @Column({ name: "pacienteid", type: "int", precision: 10 })
  pacienteId!: number;

  /**
   * Fecha asociada al campo `fecha`.
   */
  @Column({ name: "fecha", type: "date" })
  fecha!: Date;

  /**
   * Estado actual registrado en `estadoAnimo`.
   */
  @Column({ name: "estadoanimo", type: "int", precision: 10 })
  estadoAnimo!: number;

  /**
   * Indicador booleano persistido en `estres`.
   */
  @Column({ name: "estres", type: "int", precision: 10 })
  estres!: number;

  /**
   * Campo de datos asociado a `ansiedad`.
   */
  @Column({ name: "ansiedad", type: "int", precision: 10 })
  ansiedad!: number;

  /**
   * Campo de datos asociado a `horasSueno`.
   */
  @Column({
    name: "horassueno",
    type: "decimal",
    precision: 4,
    scale: 2,
    nullable: true,
  })
  horasSueno?: number;

  /**
   * Campo de datos asociado a `notaPersonal`.
   */
  @Column({
    name: "notapersonal",
    type: "nvarchar",
    length: "max",
    nullable: true,
  })
  notaPersonal?: string;

  /**
   * Campo de datos asociado a `ejercicioMinutos`.
   */
  @Column({
    name: "ejerciciominutos",
    type: "int",
    precision: 10,
    nullable: true,
  })
  ejercicioMinutos?: number;

  /**
   * Campo de datos asociado a `hidratacionLitros`.
   */
  @Column({
    name: "hidratacionlitros",
    type: "decimal",
    precision: 4,
    scale: 2,
    nullable: true,
  })
  hidratacionLitros?: number;

  /**
   * Campo de datos asociado a `descansoHoras`.
   */
  @Column({
    name: "descansohoras",
    type: "decimal",
    precision: 4,
    scale: 2,
    nullable: true,
  })
  descansoHoras?: number;

  /**
   * Campo de datos asociado a `tiempoSocialMinutos`.
   */
  @Column({
    name: "tiemposocialminutos",
    type: "int",
    precision: 10,
    nullable: true,
  })
  tiempoSocialMinutos?: number;

  /**
   * Campo de datos asociado a `pausasDigitales`.
   */
  @Column({
    name: "pausasdigitales",
    type: "int",
    precision: 10,
    nullable: true,
  })
  pausasDigitales?: number;

  /**
   * Campo de datos asociado a `creadoPor`.
   */
  @Column({ name: "creadopor", type: "nvarchar", length: 60, nullable: true })
  creadoPor?: string;

  /**
   * Campo de datos asociado a `creadoEn`.
   */
  @Column({ name: "creadoen", type: "datetime2", precision: 7 })
  creadoEn!: Date;

  /**
   * Campo de datos asociado a `modificadoPor`.
   */
  @Column({
    name: "modificadopor",
    type: "nvarchar",
    length: 60,
    nullable: true,
  })
  modificadoPor?: string;

  /**
   * Campo de datos asociado a `modificadoEn`.
   */
  @Column({
    name: "modificadoen",
    type: "datetime2",
    precision: 7,
    nullable: true,
  })
  modificadoEn?: Date;

  /**
   * Campo de datos asociado a `campoPrueba01`.
   */
  @Column({
    name: "campoprueba01",
    type: "nvarchar",
    length: 200,
    nullable: true,
  })
  campoPrueba01?: string;

  /**
   * Campo de datos asociado a `campoPrueba02`.
   */
  @Column({
    name: "campoprueba02",
    type: "nvarchar",
    length: 200,
    nullable: true,
  })
  campoPrueba02?: string;

  /**
   * Campo de datos asociado a `campoPrueba03`.
   */
  @Column({
    name: "campoprueba03",
    type: "nvarchar",
    length: 200,
    nullable: true,
  })
  campoPrueba03?: string;

  /**
   * Campo de datos asociado a `campoPrueba04`.
   */
  @Column({
    name: "campoprueba04",
    type: "nvarchar",
    length: 200,
    nullable: true,
  })
  campoPrueba04?: string;

  /**
   * Campo de datos asociado a `campoPrueba05`.
   */
  @Column({
    name: "campoprueba05",
    type: "nvarchar",
    length: 200,
    nullable: true,
  })
  campoPrueba05?: string;
}
