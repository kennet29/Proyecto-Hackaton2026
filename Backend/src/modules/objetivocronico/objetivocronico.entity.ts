import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * Entidad TypeORM que modela el recurso objetivocronico.
 */
@Entity({ name: "objetivocronico" })
export class Objetivocronico {
  /**
   * Identificador persistido para `objetivocronicoId`.
   */
  @PrimaryGeneratedColumn({ name: "objetivocronicoid", type: "int" })
  objetivocronicoId!: number;

  /**
   * Identificador persistido para `condicioncronicaId`.
   */
  @Column({ name: "condicioncronicaid", type: "int", precision: 10 })
  condicioncronicaId!: number;

  /**
   * Texto descriptivo del campo `descripcion`.
   */
  @Column({ name: "descripcion", type: "nvarchar", length: 200 })
  descripcion!: string;

  /**
   * Campo de datos asociado a `indicador`.
   */
  @Column({ name: "indicador", type: "nvarchar", length: 120, nullable: true })
  indicador?: string;

  /**
   * Campo de datos asociado a `valormeta`.
   */
  @Column({
    name: "valormeta",
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  valormeta?: number;

  /**
   * Campo de datos asociado a `unidad`.
   */
  @Column({ name: "unidad", type: "nvarchar", length: 40, nullable: true })
  unidad?: string;

  /**
   * Fecha asociada al campo `fechalimite`.
   */
  @Column({ name: "fechalimite", type: "date", nullable: true })
  fechalimite?: Date;

  /**
   * Estado actual registrado en `estado`.
   */
  @Column({ name: "estado", type: "nvarchar", length: 40 })
  estado!: string;

  /**
   * Campo de datos asociado a `cumplido`.
   */
  @Column({ name: "cumplido", type: "bit" })
  cumplido!: boolean;

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
