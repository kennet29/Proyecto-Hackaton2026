import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * Entidad TypeORM que modela el recurso estilovida.
 */
@Entity({ name: "estilovida" })
export class Estilovida {
  /**
   * Identificador persistido para `estilovidaId`.
   */
  @PrimaryGeneratedColumn({ name: "estilovidaid", type: "int" })
  estilovidaId!: number;

  /**
   * Identificador persistido para `pacienteId`.
   */
  @Column({ name: "pacienteid", type: "int", precision: 10 })
  pacienteId!: number;

  /**
   * Fecha asociada al campo `fecharegistro`.
   */
  @Column({ name: "fecharegistro", type: "date" })
  fecharegistro!: Date;

  /**
   * Campo de datos asociado a `alimentacion`.
   */
  @Column({
    name: "alimentacion",
    type: "nvarchar",
    length: 200,
    nullable: true,
  })
  alimentacion?: string;

  /**
   * Campo de datos asociado a `actividadfisica`.
   */
  @Column({
    name: "actividadfisica",
    type: "nvarchar",
    length: 200,
    nullable: true,
  })
  actividadfisica?: string;

  /**
   * Campo de datos asociado a `consumoalcohol`.
   */
  @Column({
    name: "consumoalcohol",
    type: "nvarchar",
    length: 100,
    nullable: true,
  })
  consumoalcohol?: string;

  /**
   * Campo de datos asociado a `consumotabaco`.
   */
  @Column({
    name: "consumotabaco",
    type: "nvarchar",
    length: 100,
    nullable: true,
  })
  consumotabaco?: string;

  /**
   * Campo de datos asociado a `horassueno`.
   */
  @Column({
    name: "horassueno",
    type: "decimal",
    precision: 4,
    scale: 2,
    nullable: true,
  })
  horassueno?: number;

  /**
   * Indicador booleano persistido en `estres`.
   */
  @Column({ name: "estres", type: "nvarchar", length: 100, nullable: true })
  estres?: string;

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
