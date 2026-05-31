import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * Entidad TypeORM que modela el recurso habitoespecifico.
 */
@Entity({ name: "habitoespecifico" })
export class Habitoespecifico {
  /**
   * Identificador persistido para `habitoId`.
   */
  @PrimaryGeneratedColumn({ name: "habitoid", type: "int" })
  habitoId!: number;

  /**
   * Identificador persistido para `pacienteId`.
   */
  @Column({ name: "pacienteid", type: "int", precision: 10 })
  pacienteId!: number;

  /**
   * Identificador persistido para `tipohabitoId`.
   */
  @Column({ name: "tipohabitoid", type: "int", precision: 10 })
  tipohabitoId!: number;

  /**
   * Campo de datos asociado a `categoria`.
   */
  @Column({ name: "categoria", type: "nvarchar", length: 80, nullable: true })
  categoria?: string;

  /**
   * Campo de datos asociado a `nivel`.
   */
  @Column({ name: "nivel", type: "nvarchar", length: 80, nullable: true })
  nivel?: string;

  /**
   * Campo de datos asociado a `frecuencia`.
   */
  @Column({ name: "frecuencia", type: "nvarchar", length: 100, nullable: true })
  frecuencia?: string;

  /**
   * Campo de datos asociado a `cantidad`.
   */
  @Column({
    name: "cantidad",
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  cantidad?: number;

  /**
   * Campo de datos asociado a `unidad`.
   */
  @Column({ name: "unidad", type: "nvarchar", length: 30, nullable: true })
  unidad?: string;

  /**
   * Campo de datos asociado a `inicio`.
   */
  @Column({ name: "inicio", type: "date", nullable: true })
  inicio?: Date;

  /**
   * Campo de datos asociado a `fin`.
   */
  @Column({ name: "fin", type: "date", nullable: true })
  fin?: Date;

  /**
   * Campo de datos asociado a `impactosalud`.
   */
  @Column({
    name: "impactosalud",
    type: "nvarchar",
    length: 150,
    nullable: true,
  })
  impactosalud?: string;

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
